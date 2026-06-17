from rdflib import Graph


SPARQL_TESTS = [
    {
        "id": "SP001",
        "title": "CourseInstance must have startDate",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance .
  FILTER NOT EXISTS { ?ci schema:startDate ?s . }
}
""",
        "expect": False,
        "fail_message": "CourseInstance is missing startDate.",
    },
    {
        "id": "SP002",
        "title": "CourseInstance must have endDate",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance .
  FILTER NOT EXISTS { ?ci schema:endDate ?e . }
}
""",
        "expect": False,
        "fail_message": "CourseInstance is missing endDate.",
    },
    {
        "id": "SP003",
        "title": "Course must have a provider",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?c a schema:Course .
  FILTER NOT EXISTS { ?c schema:provider ?p . }
}
""",
        "expect": False,
        "fail_message": "Course is missing a provider (University).",
    },
    {
        "id": "SP004",
        "title": "CourseInstance must have an instructor",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance .
  FILTER NOT EXISTS { ?ci schema:instructor ?i . }
}
""",
        "expect": False,
        "fail_message": "CourseInstance has no instructor assigned.",
    },
    {
        "id": "SP005",
        "title": "Course must have a name",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?c a schema:Course .
  FILTER NOT EXISTS { ?c schema:name ?n . }
}
""",
        "expect": False,
        "fail_message": "Course is missing a name.",
    },
    {
        "id": "SP006",
        "title": "endDate must not be before startDate",
        "severity": "ERROR",
        "dimension": "Consistency",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:startDate ?s ;
      schema:endDate ?e .
  FILTER (?e < ?s)
}
""",
        "expect": False,
        "fail_message": "endDate is before startDate — invalid date range.",
    },
    {
        "id": "SP007",
        "title": "ECTS credits must be between 1 and 30",
        "severity": "ERROR",
        "dimension": "Consistency",
        "query": """
PREFIX schema: <https://schema.org/>
PREFIX ex: <https://example.org/vocab/>
ASK WHERE {
  ?c a schema:Course ;
     ex:ectsCredits ?ects .
  FILTER (?ects < 1 || ?ects > 30)
}
""",
        "expect": False,
        "fail_message": "ECTS credits are outside the valid range of 1 to 30.",
    },
    {
        "id": "SP008",
        "title": "Instructor must have a name",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:instructor ?i .
  FILTER NOT EXISTS { ?i schema:name ?n . }
}
""",
        "expect": False,
        "fail_message": "Instructor is missing a name.",
    },
    {
        "id": "SP009",
        "title": "University must have a name",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?p a schema:EducationalOrganization .
  FILTER NOT EXISTS { ?p schema:name ?n . }
}
""",
        "expect": False,
        "fail_message": "A University node is missing a name.",
    },
    {
        "id": "SP010",
        "title": "CourseInstance must link to a Course node",
        "severity": "ERROR",
        "dimension": "Interoperability",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance .
  FILTER NOT EXISTS { ?ci schema:course ?c . }
}
""",
        "expect": False,
        "fail_message": "CourseInstance is not linked to a Course node.",
    },
    {
        "id": "SP011",
        "title": "Course duration must not exceed 18 months",
        "severity": "WARNING",
        "dimension": "Consistency",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:startDate ?s ;
      schema:endDate ?e .
  FILTER (
    (year(?e) * 12 + month(?e)) - (year(?s) * 12 + month(?s)) > 18
  )
}
""",
        "expect": False,
        "fail_message": "Course duration exceeds 18 months — unusually long.",
    },
    {
        "id": "SP012",
        "title": "Course duration must be at least 1 day",
        "severity": "WARNING",
        "dimension": "Consistency",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:startDate ?s ;
      schema:endDate ?e .
  FILTER (?e = ?s)
}
""",
        "expect": False,
        "fail_message": "Course startDate and endDate are the same — zero duration.",
    },
    {
        "id": "SP013",
        "title": "Maximum enrollment must not exceed 500",
        "severity": "WARNING",
        "dimension": "Consistency",
        "query": """
PREFIX schema: <https://schema.org/>
PREFIX ex: <https://example.org/vocab/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:maximumAttendeeCapacity ?cap .
  FILTER (?cap > 500)
}
""",
        "expect": False,
        "fail_message": "Maximum enrollment exceeds 500 — unrealistically high.",
    },
    {
        "id": "SP014",
        "title": "Instructor name must not look like an email address",
        "severity": "ERROR",
        "dimension": "Accuracy",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:instructor ?i .
  ?i schema:name ?n .
  FILTER (CONTAINS(STR(?n), "@"))
}
""",
        "expect": False,
        "fail_message": "Instructor name contains '@' — looks like an email was entered instead of a name.",
    },
    {
        "id": "SP015",
        "title": "Course name must not contain only digits",
        "severity": "ERROR",
        "dimension": "Accuracy",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?c a schema:Course ;
     schema:name ?n .
  FILTER REGEX(STR(?n), "^[0-9]+$")
}
""",
        "expect": False,
        "fail_message": "Course name contains only digits — likely a data entry error.",
    },
    {
        "id": "SP016",
        "title": "Course startDate must not be before year 2000",
        "severity": "WARNING",
        "dimension": "Timeliness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:startDate ?s .
  FILTER (year(?s) < 2000)
}
""",
        "expect": False,
        "fail_message": "Course startDate is before year 2000 — likely a data error.",
    },
    {
        "id": "SP017",
        "title": "Course endDate must not be more than 2 years in the future",
        "severity": "WARNING",
        "dimension": "Timeliness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:endDate ?e .
  FILTER (year(?e) > 2027)
}
""",
        "expect": False,
        "fail_message": "Course endDate is more than 2 years in the future — check the date.",
    },
    {
        "id": "SP018",
        "title": "Course must have a location assigned",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance .
  FILTER NOT EXISTS { ?ci schema:location ?l . }
}
""",
        "expect": False,
        "fail_message": "CourseInstance has no location — a room or place must be assigned.",
    },
    {
        "id": "SP019",
        "title": "Course must have a description",
        "severity": "ERROR",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?c a schema:Course .
  FILTER NOT EXISTS { ?c schema:description ?d . }
}
""",
        "expect": False,
        "fail_message": "Course is missing a description.",
    },
    {
        "id": "SP020",
        "title": "ECTS credits must use standard values (3, 4, 5, 6, 8, 9, 10, 12)",
        "severity": "WARNING",
        "dimension": "Consistency",
        "query": """
PREFIX ex: <https://example.org/vocab/>
ASK WHERE {
  ?c ex:ectsCredits ?ects .
  FILTER (?ects NOT IN (3, 4, 5, 6, 8, 9, 10, 12))
}
""",
        "expect": False,
        "fail_message": "ECTS credits use a non-standard value — expected one of: 3, 4, 5, 6, 8, 9, 10, 12.",
    },
    {
        "id": "SP021",
        "title": "Maximum enrollment must be at least 1",
        "severity": "ERROR",
        "dimension": "Consistency",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:maximumAttendeeCapacity ?cap .
  FILTER (?cap < 1)
}
""",
        "expect": False,
        "fail_message": "Maximum enrollment is less than 1 — no students could enrol.",
    },
    {
        "id": "SP022",
        "title": "Instructor must have a valid email address",
        "severity": "WARNING",
        "dimension": "Completeness",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:instructor ?i .
  FILTER NOT EXISTS { ?i schema:email ?e . }
}
""",
        "expect": False,
        "fail_message": "Instructor has no email address — reduces reusability and contact traceability.",
    },
    {
        "id": "SP023",
        "title": "Instructor name must not be a placeholder value",
        "severity": "ERROR",
        "dimension": "Accuracy",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?ci a schema:CourseInstance ;
      schema:instructor ?i .
  ?i schema:name ?n .
  FILTER (
    STR(?n) = "Unknown" ||
    STR(?n) = "Unknown Instructor" ||
    STR(?n) = "" ||
    STR(?n) = "nan" ||
    STRLEN(STR(?n)) < 3
  )
}
""",
        "expect": False,
        "fail_message": "Instructor name is a placeholder or missing — a real instructor name is required.",
    },
    {
        "id": "SP024",
        "title": "Course code must match required format PREFIX-DEPT-NUMBER",
        "severity": "ERROR",
        "dimension": "Accuracy",
        "query": """
PREFIX schema: <https://schema.org/>
ASK WHERE {
  ?c a schema:Course ;
     schema:courseCode ?code .
  FILTER (!REGEX(STR(?code), "^[A-Z]{2,4}-[A-Z]{2,6}-[0-9]{3}[B]?$"))
}
""",
        "expect": False,
        "fail_message": "Course code does not match required format (e.g. TUC-CS-101) — missing dashes or wrong structure.",
    },
]


def run_sparql_tests(graph: Graph) -> dict:
    results = []
    passed  = 0
    failed  = 0

    triple_count = len(graph)
    print(f"[SPARQL] Running {len(SPARQL_TESTS)} tests on graph with {triple_count} triples")

    if triple_count == 0:
        print("[SPARQL] WARNING: Graph is empty — all tests will fail. Check rdf_builder.")
        for t in SPARQL_TESTS:
            results.append({
                "id":        t["id"],
                "title":     t["title"],
                "severity":  t["severity"],
                "dimension": t["dimension"],
                "passed":    False,
                "message":   "Graph is empty — no RDF data was built from this instance.",
                "askResult": None,
            })
            failed += 1
        return {"passed": 0, "failed": failed, "results": results,
                "debug": "Graph was empty — check rdf_builder.py"}

    for t in SPARQL_TESTS:
        try:
            qres= graph.query(t["query"])
            got= bool(getattr(qres, "askAnswer", False))
            ok = (got == t["expect"])

            msg = "OK" if ok else t["fail_message"]
            if not ok:
                print(f"[SPARQL] {t['id']} FAILED — ASK returned {got}, expected {t['expect']}")
        except Exception as e:
            ok= False
            got= None
            msg = f"SPARQL error: {e}"
            print(f"[SPARQL] {t['id']} EXCEPTION — {e}")

        results.append({
            "id":t["id"],
            "title": t["title"],
            "severity": t["severity"],
            "dimension": t["dimension"],
            "passed":  ok,
            "message":msg,
            "askResult": got,
        })

        if ok:
            passed += 1
        else:
            failed += 1

    print(f"[SPARQL] Done {passed} passed, {failed} failed")
    return {"passed": passed, "failed": failed, "results": results}