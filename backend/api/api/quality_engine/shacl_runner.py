from pathlib import Path
from rdflib import Graph, URIRef
from rdflib.namespace import RDF
from pyshacl import validate

SH = "http://www.w3.org/ns/shacl#"
SH_ValidationResult = URIRef(SH + "ValidationResult")
SH_resultMessage = URIRef(SH + "resultMessage")
SH_resultSeverity = URIRef(SH + "resultSeverity")
SH_focusNode = URIRef(SH + "focusNode")
SH_resultPath = URIRef(SH + "resultPath")
SH_sourceConstraintComponent = URIRef(SH + "sourceConstraintComponent")

def run_shacl(graph: Graph, shapes_path: str) -> dict:
    shapes_file = Path(shapes_path)
    if not shapes_file.exists():
        return {
            "conforms": False,
            "violations": [{
                "severity": "ERROR",
                "message": f"SHACL shapes file not found: {str(shapes_file)}",
                "focusNode": None,
                "resultPath": None,
                "constraintComponent": None,
            }],
            "reportText": "",
        }

    conforms, report_graph, report_text = validate(
        data_graph=graph,
        shacl_graph=str(shapes_file),
        inference="rdfs",
        abort_on_error=False,
        meta_shacl=False,
        advanced=True,
        debug=False,
    )

    violations = []
    for r in report_graph.subjects(RDF.type, SH_ValidationResult):
        violations.append({
            "severity": str(report_graph.value(r, SH_resultSeverity) or ""),
            "message": str(report_graph.value(r, SH_resultMessage) or ""),
            "focusNode": str(report_graph.value(r, SH_focusNode) or ""),
            "resultPath": str(report_graph.value(r, SH_resultPath) or ""),
            "constraintComponent": str(report_graph.value(r, SH_sourceConstraintComponent) or ""),
        })

    return {
        "conforms": bool(conforms),
        "violations": violations,
        "reportText": report_text if (not conforms) else "",
    }