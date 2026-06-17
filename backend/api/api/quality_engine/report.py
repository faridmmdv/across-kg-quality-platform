import re
from .rdf_builder import build_graph_from_instance
from .shacl_runner import run_shacl
from .sparql_tests import run_sparql_tests

def _score(passed: int, total: int) -> float:
    return round(passed / total, 2) if total > 0 else 0.0

def _is_meaningful(val, min_length=3):
    if not val:
        return False
    return len(str(val).strip()) >= min_length

def _is_valid_email(val):
    if not val:
        return False
    val = str(val).strip()
    return "@" in val and "." in val and len(val) >= 6 and val != "empty"


def _strip_suffix(code: str) -> str:
    if not code:
        return code
    parts = code.rsplit("-", 1)
    if len(parts) == 2 and len(parts[1]) == 6 and parts[1].isalnum() and parts[1].isupper():
        return parts[0]
    return code

def assess_fair(instance, graph, shacl_result, sparql_result) -> dict:
    course = instance.course
    instr = instance.instructor
    shacl_conforms = bool(shacl_result.get("conforms", False))
    sparql_all_pass = sparql_result.get("failed", 0) == 0

    # F - Findability
    raw_code = course.course_code or ""
    course_code = _strip_suffix(raw_code)
    code_pattern = bool(re.match(
        r'^[A-Z]{2,4}-[A-Z]{2,6}-[0-9]{3}[B]?$', course_code.strip()
    ))

    f_criteria = {
        "has_global_rdf_uri": True,
        "course_code_valid": code_pattern,
        "has_meaningful_name": _is_meaningful(course.name, min_length=4),
        "has_provider": bool(course.provider and course.provider.name),
        "has_term": _is_meaningful(getattr(instance, "term", None)),
    }
    f_passed = sum(f_criteria.values())
    f_score = _score(f_passed, len(f_criteria))
    f_notes = []
    if not f_criteria["course_code_valid"]:
        f_notes.append("F: Course code does not match required format.")
    if not f_criteria["has_term"]:
        f_notes.append("F: Add a term to improve findability.")
    
    a_criteria = {
        "accessible_via_standard_protocol": True,
        "accessible_via_sparql_endpoint": True,
        "metadata_retrievable_via_api": True,
        "open_access_no_auth_required": True,
        "protocol_is_http_rest": True,
    }
    a_passed = sum(a_criteria.values())
    a_score = _score(a_passed, len(a_criteria))
    a_notes = [
        "A: Data is accessible via HTTP/REST API and SPARQL endpoint using standard protocols.",
        "A: Metadata is retrievable independently through the REST API without authentication.",
    ]

    i_criteria = {
        "uses_schema_org": True,
        "uses_rdf_format": True,
        "instructor_typed_as_person": bool(instr),
        "provider_typed_as_edu_org": bool(course.provider),
        "ects_uses_vocab": (
            course.ects_credits is not None and int(course.ects_credits) > 0
        ),
    }
    i_passed = sum(i_criteria.values())
    i_score = _score(i_passed, len(i_criteria))
    i_notes = ["I: schema.org vocabulary used — supports cross-system interoperability."]
    if not i_criteria["ects_uses_vocab"]:
        i_notes.append("I: ECTS credits missing or zero — add valid credit value.")

    desc = getattr(course, "description", "") or ""
    ects = course.ects_credits or 0

    r_criteria = {
        "has_meaningful_description": len(desc.strip()) >= 20,
        "has_instructor_email": _is_valid_email(getattr(instr, "email", None)),
        "ects_in_realistic_range": (1 <= int(ects) <= 12) if ects else False,
        "has_start_date": bool(instance.start_date),
        "has_location": bool(instance.location),
    }
    r_passed = sum(r_criteria.values())
    r_score = _score(r_passed, len(r_criteria))
    r_notes = []
    if not r_criteria["has_meaningful_description"]:
        r_notes.append("R: Add a description of at least 20 characters.")
    if not r_criteria["has_instructor_email"]:
        r_notes.append("R: Instructor email missing,reduces reusability.")
    if not r_criteria["ects_in_realistic_range"]:
        r_notes.append("R: ECTS credits should be between 1 and 12 for a typical course.")
    if not r_criteria["has_start_date"]:
        r_notes.append("R: Start date is missing,add it to improve metadata completeness.")
    if not r_criteria["has_location"]:
        r_notes.append("R: Location is missing,add a room or place to improve metadata completeness.")

    
    if not bool(instance.end_date):
        r_notes.append("R: End date is missing, add it to improve metadata completeness.")
    if instance.maximum_enrollment is not None and int(instance.maximum_enrollment) > 500:
        r_notes.append("R: Enrollment cap is unrealistically high (>500).")
    if instance.maximum_enrollment is not None and int(instance.maximum_enrollment) == 0:
        r_notes.append("R: Enrollment cap are zero no students can enrol.")
    if not shacl_conforms:
        r_notes.append("R: SHACL violations reduce data trustworthiness.")
    if not sparql_all_pass:
        r_notes.append("R: Some SPARQL tests failed,data integrity issues found.")

    base_score = _score(
        f_passed + a_passed + i_passed + r_passed,
        len(f_criteria) + len(a_criteria) + len(i_criteria) + len(r_criteria)
    )
    sparql_total = sparql_result.get("passed", 0) + sparql_result.get("failed", 0)
    sparql_passed_count = sparql_result.get("passed", 0)
    sparql_ratio = _score(sparql_passed_count, sparql_total) if sparql_total > 0 else 1.0
    violation_count = len(shacl_result.get("violations", []))
    shacl_penalty = min(violation_count * 0.05, 0.3)

    overall_score = round(
        max(0.0, (base_score * 0.6) + (sparql_ratio * 0.4) - shacl_penalty), 2
    )

    return {
        "overall_score": overall_score,
        "F_score": f_score,
        "A_score": a_score,
        "I_score": i_score,
        "R_score": r_score,
        "F_issues": [k for k, v in f_criteria.items() if not v],
        "A_issues": [k for k, v in a_criteria.items() if not v],
        "I_issues": [k for k, v in i_criteria.items() if not v],
        "R_issues": [k for k, v in r_criteria.items() if not v],
        "notes": f_notes + a_notes + i_notes + r_notes,
        "F_findable": f_score >= 0.6,
        "A_accessible": a_score >= 0.6,
        "I_interoperable": i_score >= 0.6,
        "R_reusable": r_score >= 0.6,
    }

def build_quality_report(instance, shapes_path: str) -> dict:
    graph = build_graph_from_instance(instance)
    shacl_result = run_shacl(graph, shapes_path=shapes_path)
    sparql_result = run_sparql_tests(graph)
    fair = assess_fair(instance, graph, shacl_result, sparql_result)
    shacl_conforms = bool(shacl_result.get("conforms", False))
    shacl_violation_count = len(shacl_result.get("violations", []))
    sparql_failed = int(sparql_result.get("failed", 0))

    overall = "PASS" if (
        shacl_conforms and shacl_violation_count == 0 and sparql_failed == 0
    ) else "FAIL"

    raw_code = instance.course.course_code or ""
    display_code = raw_code
    parts = raw_code.rsplit("-", 1)
    if len(parts) == 2 and len(parts[1]) == 6 and parts[1].isalnum() and parts[1].isupper():
        display_code = parts[0]

    return {
        "overall": overall,
        "entity": {
            "courseInstanceId": instance.id,
            "provider": instance.course.provider.name,
            "courseCode": display_code,
            "courseName": instance.course.name,
        },
        "summary": {
            "shaclConforms": shacl_conforms,
            "shaclViolationCount": shacl_violation_count,
            "sparqlFailedCount": sparql_failed,
            "fairOverallScore": fair["overall_score"],
        },
        "shacl": shacl_result,
        "sparql": sparql_result,
        "fair": fair,
    }