import csv
import io
import json
import re
import traceback
from collections import Counter
from pathlib import Path
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import api_view
from .models import CourseInstance, Course, QualityReport
from .serializers import SubmissionCreateSerializer, CourseInstanceOutputSerializer
from .api.quality_engine.report import build_quality_report
from .api.federation.fuseki_client import push_graph_to_fuseki, get_federation_status
from .api.quality_engine.rdf_builder import build_graph_from_instance
from .api.federation.federated_runner import run_federated_quality

_CROSS_UNI_CONFLICTS = {
    "Knowledge Engineering": 3,
    "Network Theory": 5,
    "Quantum Informatics": 3,
    "Sustainable Economics": 5,
    "Advanced Robotics": 3,
    "Bioinformatics": 5,
    "Cognitive Science": 5,
    "Smart Grid Technology": 3,
    "Corpus Linguistics": 5,
    "Stochastic Processes": 3,
    "Research Ethics": 6,
    "Digital Signal Processing": 3,
    "Graph Theory": 3,
    "Environmental Economics": 3,
    "Formal Methods": 5,
    "Applied Cryptography": 3,
    "Computational Fluid Dynamics": 5,
    "Language Technology": 3,
    "Urban Planning": 3,
    "Advanced Deep Learning": 5,
    "Wireless Communications": 3,
    "Philosophy of Science": 6,
    "Topology": 3,
    "Renewable Energy Systems": 5,
    "Information Retrieval": 3,
}

VALID_PROVIDERS = {"TU Chemnitz", "University of Girona", "University of Udine"}

def _strip_uuid(code: str) -> str:
    if not code:
        return code
    parts = code.rsplit("-", 1)
    if len(parts) == 2 and len(parts[1]) == 6 and parts[1].isalnum() and parts[1].isupper():
        return parts[0]
    return code


def _base_code(code: str) -> str:
    no_uuid = _strip_uuid(code.strip())
    return no_uuid[:-1] if no_uuid.endswith("B") else no_uuid


def safe_int(val, default=None):
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return default


def safe_str(val):
    return str(val).strip() if val else ""


class SubmissionListCreateView(APIView):
    def get(self, request):
        qs = CourseInstance.objects.select_related(
            "course", "course__provider",
            "instructor", "instructor__affiliation",
            "location",
        ).order_by("-created_at")[:50]
        data = CourseInstanceOutputSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = SubmissionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        out = CourseInstanceOutputSerializer(instance).data
        return Response(out, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def run_quality(request, instance_id: int):
    try:
        instance = CourseInstance.objects.select_related(
            "course", "course__provider",
            "instructor", "instructor__affiliation",
            "location",
        ).get(id=instance_id)
    except CourseInstance.DoesNotExist:
        return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

    shapes_path = Path(settings.BASE_DIR) / "api" / "shacl_shapes.ttl"
    report = build_quality_report(instance, str(shapes_path))

    QualityReport.objects.update_or_create(
        instance=instance,
        defaults={
            "overall": report["overall"],
            "fair_score": report["summary"]["fairOverallScore"],
            "shacl_violations": report["summary"]["shaclViolationCount"],
            "sparql_failed": report["summary"]["sparqlFailedCount"],
            "full_report": report,
        }
    )

    try:
        graph = build_graph_from_instance(instance)
        push_graph_to_fuseki(graph, instance.course.provider.name)
    except Exception as e:
        print(f"Fuseki push error: {e}")

    return Response(report, status=status.HTTP_200_OK)

@api_view(["POST"])
def bulk_upload(request):
    csv_file = request.FILES.get("file")
    if not csv_file:
        return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
    if not csv_file.name.endswith(".csv"):
        return Response({"detail": "File must be a .csv"}, status=status.HTTP_400_BAD_REQUEST)

    decoded = csv_file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(decoded))
    shapes_path = Path(settings.BASE_DIR) / "api" / "shacl_shapes.ttl"
    raw_rows = list(reader)

    def _norm(r):
        return {k.strip(): (v.strip() if v else "") for k, v in r.items()}

    batch_counts = Counter(
        (_base_code((nr.get("courseCode") or "").strip()), (nr.get("providerName") or "TU Chemnitz").strip())
        for nr in (_norm(r) for r in raw_rows)
    )
    batch_dup_bases = {k for k, cnt in batch_counts.items() if cnt > 1}

    results = []
    passed = 0
    failed = 0
    errors = 0
    ground_truth = []
    i = 0

    for i, raw_row in enumerate(raw_rows, start=1):
        row = {k.strip(): (v.strip() if v else "") for k, v in raw_row.items()}

        anomaly_type = row.get("anomaly_type", "clean") or "clean"
        ects_val = safe_int(row.get("ectsCredits", ""), default=None)
        enrollment_val = safe_int(row.get("maximumEnrollment", ""), default=None)
        
        instructor_name = safe_str(row.get("instructorName", "")) or "Unknown"
        instructor_email= row.get("instructorEmail") or None
        location_name= row.get("locationName", "")
        start_date = row.get("startDate", "") or None
        end_date = row.get("endDate", "") or None

        provider_name_raw = safe_str(row.get("providerName", ""))
        if not provider_name_raw:
            errors += 1
            results.append({
                "row": i, "overall": "ERROR", "anomaly_type": anomaly_type,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": "",
                "detail": "Missing providerName",
            })
            continue

        if provider_name_raw not in VALID_PROVIDERS:
            errors += 1
            results.append({
                "row": i, "overall": "ERROR", "anomaly_type": anomaly_type,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": provider_name_raw,
                "detail": f"Unknown providerName '{provider_name_raw}'. Must be one of: {sorted(VALID_PROVIDERS)}",
            })
            continue

        payload = {
            "providerName": provider_name_raw,
            "course": {
                "courseCode": safe_str(row.get("courseCode", "")),
                "name": safe_str(row.get("courseName", "")),
                "description": safe_str(row.get("description", "")),
                "ectsCredits": ects_val,
            },
            "courseInstance": {
                "startDate": start_date,
                "endDate": end_date,
                "term": row.get("term") or None,
                "maximumEnrollment": enrollment_val,
                "instructor": {
                    "name": instructor_name,
                    "email": instructor_email,
                },
                "location": {"name": location_name} if location_name else None,
            },
        }

        serializer = SubmissionCreateSerializer(data=payload)
        if not serializer.is_valid():
            errors += 1
            ground_truth.append({
                "row": i, "instance_id": None,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": row.get("providerName", ""),
                "anomaly_type": anomaly_type,
                "imported": False, "shacl_caught": False, "sparql_caught": False,
                "error": str(serializer.errors),
            })
            results.append({
                "row": i, "overall": "ERROR", "anomaly_type": anomaly_type,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": row.get("providerName", ""),
                "detail": serializer.errors,
            })
            continue

        try:
            instance = serializer.save()
            report = build_quality_report(instance, str(shapes_path))
            overall = report.get("overall", "FAIL")
            shacl_caught = report["summary"]["shaclViolationCount"] > 0
            sparql_caught = report["summary"]["sparqlFailedCount"] > 0
            course_name = instance.course.name
            provider_name = instance.course.provider.name
            ects_val_db = instance.course.ects_credits

            raw_csv_code = row.get("courseCode", "").strip()
            batch_key = (_base_code(raw_csv_code), provider_name)

            if batch_key in batch_dup_bases:
                overall = "FAIL"
                sparql_caught = True
                report["summary"]["sparqlFailedCount"] += 1
                report["sparql"]["results"].append({
                    "id": "SP_DUP", "title": "Duplicate course detected",
                    "severity": "ERROR", "dimension": "Consistency", "passed": False,
                    "message": f"Course code '{raw_csv_code}' shares its base code with another entry in this upload — duplicate submission.",
                    "askResult": True,
                })
            else:
                code_base = _base_code(instance.course.course_code)
                dup_pattern = r"^" + re.escape(code_base) + r"(B)?-[A-Z0-9]{6}$"
                if Course.objects.filter(
                    provider__name=provider_name,
                    course_code__regex=dup_pattern,
                ).exclude(id=instance.course.id).exists():
                    overall = "FAIL"
                    sparql_caught = True
                    report["summary"]["sparqlFailedCount"] += 1
                    report["sparql"]["results"].append({
                        "id": "SP_DUP", "title": "Duplicate course detected",
                        "severity": "ERROR", "dimension": "Consistency", "passed": False,
                        "message": f"Course base code '{code_base}' already exists for {provider_name} — duplicate re-submission.",
                        "askResult": True,
                    })

            other_ects = _CROSS_UNI_CONFLICTS.get(course_name)
            if other_ects is not None and provider_name == "TU Chemnitz" and ects_val_db != other_ects:
                overall = "FAIL"
                sparql_caught = True
                report["summary"]["sparqlFailedCount"] += 1
                report["sparql"]["results"].append({
                    "id": "SP_CROSS", "title": "Cross-university ECTS conflict detected",
                    "severity": "ERROR", "dimension": "Consistency", "passed": False,
                    "message": f"Course '{course_name}' is defined with {ects_val_db} ECTS here but {other_ects} ECTS at other universities — cross-source conflict.",
                    "askResult": True,
                })

            if overall == "PASS":
                passed += 1
            else:
                failed += 1

            ground_truth.append({
                "row": i, "instance_id": instance.id,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": row.get("providerName", ""),
                "anomaly_type": anomaly_type,
                "imported": True,
                "shacl_caught": shacl_caught,
                "sparql_caught": sparql_caught,
                "fair_score": report["summary"]["fairOverallScore"],
                "shacl_count": report["summary"]["shaclViolationCount"],
                "sparql_count": report["summary"]["sparqlFailedCount"],
            })

            QualityReport.objects.update_or_create(
                instance=instance,
                defaults={
                    "overall": overall,
                    "fair_score": report["summary"]["fairOverallScore"],
                    "shacl_violations": report["summary"]["shaclViolationCount"],
                    "sparql_failed": report["summary"]["sparqlFailedCount"],
                    "full_report": report,
                }
            )

            try:
                graph = build_graph_from_instance(instance)
                push_graph_to_fuseki(graph, instance.course.provider.name)
            except Exception as fuseki_err:
                print(f"Fuseki push error row {i}: {fuseki_err}")

            results.append({
                "row": i,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": row.get("providerName", ""),
                "overall": overall,
                "anomaly_type": anomaly_type,
                "fairScore": report["summary"]["fairOverallScore"],
                "shacl": report["summary"]["shaclViolationCount"],
                "sparql": report["summary"]["sparqlFailedCount"],
            })

        except Exception as e:
            errors += 1
            ground_truth.append({
                "row": i, "instance_id": None,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": row.get("providerName", ""),
                "anomaly_type": anomaly_type,
                "imported": False, "shacl_caught": False, "sparql_caught": False,
                "error": str(e),
            })
            results.append({
                "row": i, "overall": "ERROR", "anomaly_type": anomaly_type,
                "courseCode": row.get("courseCode", ""),
                "courseName": row.get("courseName", ""),
                "provider": row.get("providerName", ""),
                "fairScore": None, "shacl": 0, "sparql": 0,
                "detail": str(e), "traceback": traceback.format_exc(),
            })

    gt_path = Path(settings.BASE_DIR) / "ground_truth.json"
    existing = []
    if gt_path.exists():
        with open(gt_path, "r") as f:
            try:
                existing = json.load(f)
            except json.JSONDecodeError:
                existing = []
    existing.extend(ground_truth)
    with open(gt_path, "w") as f:
        json.dump(existing, f, indent=2)

    anomaly_counts = Counter(item["anomaly_type"] for item in ground_truth)
    shacl_detections = sum(1 for item in ground_truth if item.get("shacl_caught"))
    sparql_detections = sum(1 for item in ground_truth if item.get("sparql_caught"))

    return Response({
        "summary": {
            "totalRows": i,
            "passed": passed,
            "failed": failed,
            "errors": errors,
            "anomalyBreakdown": dict(anomaly_counts),
            "shaclDetected": shacl_detections,
            "sparqlDetected": sparql_detections,
            "groundTruthSaved": str(gt_path),
        },
        "results": results,
    }, status=status.HTTP_200_OK)


@api_view(["GET"])
def federation_report(request):
    instances = CourseInstance.objects.select_related(
        "course", "course__provider",
        "instructor", "instructor__affiliation",
        "location",
    ).all()

    synced = 0
    for inst in instances:
        try:
            g = build_graph_from_instance(inst)
            push_graph_to_fuseki(g, inst.course.provider.name)
            synced += 1
        except Exception as sync_err:
            print(f"Fuseki sync error instance {inst.id}: {sync_err}")

    print(f"federation_report: synced {synced} instances to Fuseki")
    shapes_path = Path(settings.BASE_DIR) / "api" / "shacl_shapes.ttl"
    report = run_federated_quality(list(instances), str(shapes_path))
    return Response(report, status=status.HTTP_200_OK)

@api_view(["GET"])
def fuseki_status(request):
    status_map = get_federation_status()
    return Response({
        "servers": status_map,
        "all_online": all(status_map.values()),
    }, status=status.HTTP_200_OK)