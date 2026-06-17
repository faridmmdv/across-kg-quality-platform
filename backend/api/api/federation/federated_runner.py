from rdflib import Graph
from .fuseki_client import get_all_triples, check_fuseki_available
from ..quality_engine.shacl_runner import run_shacl
from ..quality_engine.sparql_tests import run_sparql_tests
from ..quality_engine.report import assess_fair

UNIVERSITIES = ["TU Chemnitz", "University of Girona", "University of Udine"]

def run_university_quality_from_fuseki(university_name: str, shapes_path: str, instances: list) -> dict:
    fuseki_available = check_fuseki_available(university_name)
    if fuseki_available:
        graph = get_all_triples(university_name)
        source = "fuseki"
    else:
        from ..quality_engine.rdf_builder import build_graph_from_instance
        graph = Graph()
        for instance in instances:
            g = build_graph_from_instance(instance)
            for triple in g:
                graph.add(triple)
        source = "django_fallback"

    if len(graph) == 0:
        return {
            "overall": "NO DATA",
            "fairScore": 0.0,
            "shaclConforms": False,
            "shaclViolations": 0,
            "sparqlFailed": 0,
            "totalCourses": len(instances),
            "source": source,
        }

    shacl_result = run_shacl(graph, shapes_path=shapes_path)
    sparql_result = run_sparql_tests(graph)
    shacl_conforms = bool(shacl_result.get("conforms", False))
    shacl_violation_count = len(shacl_result.get("violations", []))
    sparql_failed = int(sparql_result.get("failed", 0))

    fair_scores = []
    for instance in instances:
        try:
            fair = assess_fair(instance, graph, shacl_result, sparql_result)
            fair_scores.append(fair["overall_score"])
        except Exception:
            pass

    avg_fair = round(sum(fair_scores) / len(fair_scores), 2) if fair_scores else 0.0
    overall = "PASS" if (shacl_conforms and shacl_violation_count == 0 and sparql_failed == 0) else "FAIL"

    return {
        "overall": overall,
        "fairScore": avg_fair,
        "shaclConforms": shacl_conforms,
        "shaclViolations": shacl_violation_count,
        "sparqlFailed": sparql_failed,
        "totalCourses": len(instances),
        "source": source,
        "shacl": shacl_result,
        "sparql": sparql_result,
    }


def detect_conflicts(university_data: dict) -> list:
    conflicts = []
    course_map = {}
    for uni, data in university_data.items():
        for instance in data["instances"]:
            code = instance.course.course_code
            if code not in course_map:
                course_map[code] = []
            course_map[code].append({
                "university": uni,
                "ects": instance.course.ects_credits,
                "name": instance.course.name,
                "has_desc": bool(getattr(instance.course, "description", "")),
                "has_email": bool(getattr(instance.instructor, "email", "")),
                "has_loc": bool(instance.location),
            })

    for code, entries in course_map.items():
        if len(entries) < 2:
            continue

        ects_values = set(e["ects"] for e in entries)
        if len(ects_values) > 1:
            conflicts.append({
                "type": "ects_mismatch",
                "courseCode": code,
                "message": f"Course {code} has different ECTS credits across universities.",
                "detail": {e["university"]: e["ects"] for e in entries},
            })

        names = set(e["name"].lower().strip() for e in entries)
        if len(names) > 1:
            conflicts.append({
                "type": "name_mismatch",
                "courseCode": code,
                "message": f"Course {code} has different names across universities.",
                "detail": {e["university"]: e["name"] for e in entries},
            })

    for uni, data in university_data.items():
        instances = data["instances"]
        if not instances:
            continue
        total = len(instances)
        no_email = sum(1 for i in instances if not getattr(i.instructor, "email", ""))
        no_loc = sum(1 for i in instances if not i.location)
        no_desc = sum(1 for i in instances if not getattr(i.course, "description", ""))

        if no_email == total:
            conflicts.append({
                "type": "schema_gap",
                "university": uni,
                "message": f"{uni} has no instructor emails, reduces interoperability.",
                "detail": {"missing": "instructor_email", "count": no_email},
            })
        if no_loc == total:
            conflicts.append({
                "type": "schema_gap",
                "university": uni,
                "message": f"{uni} has no location data for any course.",
                "detail": {"missing": "location", "count": no_loc},
            })
        if no_desc == total:
            conflicts.append({
                "type": "schema_gap",
                "university": uni,
                "message": f"{uni} has no course descriptions.",
                "detail": {"missing": "description", "count": no_desc},
            })

    return conflicts

def run_federated_quality(instances_qs, shapes_path: str) -> dict:
    university_data = {}
    for uni in UNIVERSITIES:
        uni_instances = [i for i in instances_qs if i.course.provider.name == uni]
        university_data[uni] = {"instances": uni_instances}

    results = {}
    for uni, data in university_data.items():
        instances = data["instances"]
        if not instances:
            results[uni] = {
                "overall": "NO DATA",
                "fairScore": 0.0,
                "shaclConforms": False,
                "shaclViolations": 0,
                "sparqlFailed": 0,
                "totalCourses": 0,
                "source": "none",
            }
            continue
        results[uni] = run_university_quality_from_fuseki(uni, shapes_path, instances)

    conflicts = detect_conflicts(university_data)
    scores = [r["fairScore"] for r in results.values() if r["fairScore"] > 0]
    federation_score = round(sum(scores) / len(scores), 2) if scores else 0.0
    total_courses = sum(r["totalCourses"] for r in results.values())
    fuseki_status = {uni: check_fuseki_available(uni) for uni in UNIVERSITIES}

    return {
        "federationScore": federation_score,
        "totalCourses": total_courses,
        "totalConflicts": len(conflicts),
        "universities": results,
        "conflicts": conflicts,
        "fusekiStatus": fuseki_status,
    }