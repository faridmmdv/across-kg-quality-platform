from urllib.parse import quote
from rdflib import Graph, Namespace, URIRef, Literal
from rdflib.namespace import RDF, XSD

SCHEMA = Namespace("https://schema.org/")
EX = Namespace("https://example.org/vocab/")
BASE = "https://example.org/resource/"

EX_ectsCredits = URIRef("https://example.org/vocab/ectsCredits")
EX_term= URIRef("https://example.org/vocab/term")

def _safe(s: str) -> str:
    return quote((s or "").strip().replace(" ", "_"), safe="_-")

def _uri(kind: str, key: str) -> URIRef:
    return URIRef(f"{BASE}{kind}/{_safe(key)}")

def _strip_uuid_suffix(code: str) -> str:
    if not code:
        return code
    parts = code.rsplit("-", 1)
    if len(parts) == 2 and len(parts[1]) == 6 and parts[1].isalnum() and parts[1].isupper():
        return parts[0]
    return code

def build_graph_from_instance(instance) -> Graph:
    g = Graph()
    g.bind("schema", SCHEMA)
    g.bind("ex", EX)
    course = instance.course
    uni = course.provider
    instr = instance.instructor
    place = instance.location
    uni_uri = _uri("university", f"{uni.id}-{uni.name}")
    course_uri= _uri("course", f"{uni.id}-{course.course_code}")
    instance_uri = _uri("course-instance", f"{instance.id}")
    instr_uri = _uri("person", f"{instr.id}-{instr.name}")
    place_uri = _uri("place", f"{place.id}-{place.name}") if place else None
    g.add((uni_uri, RDF.type, SCHEMA.EducationalOrganization))
    g.add((uni_uri, SCHEMA.name, Literal(uni.name)))
    g.add((course_uri, RDF.type, SCHEMA.Course))
    g.add((course_uri, SCHEMA.provider, uni_uri))
    display_code = _strip_uuid_suffix(course.course_code or "")
    g.add((course_uri, SCHEMA.courseCode, Literal(display_code)))
    g.add((course_uri, SCHEMA.name, Literal(course.name or "")))
    if course.description:
        g.add((course_uri, SCHEMA.description, Literal(course.description)))
    if course.ects_credits is not None:
        try:
            ects_val = int(course.ects_credits)
            g.add((course_uri, EX_ectsCredits,
                   Literal(ects_val, datatype=XSD.integer)))
        except (ValueError, TypeError):
            pass

    g.add((instr_uri, RDF.type, SCHEMA.Person))
    g.add((instr_uri, SCHEMA.name, Literal(instr.name or "")))

    if getattr(instr, "email", None):
        g.add((instr_uri, SCHEMA.email, Literal(instr.email)))

    affiliation = getattr(instr, "affiliation", None)
    if affiliation:
        aff_uri = _uri("university", f"{affiliation.id}-{affiliation.name}")
        g.add((aff_uri, RDF.type, SCHEMA.EducationalOrganization))
        g.add((aff_uri, SCHEMA.name, Literal(affiliation.name)))
        g.add((instr_uri, SCHEMA.affiliation, aff_uri))

    if place_uri:
        g.add((place_uri, RDF.type, SCHEMA.Place))
        g.add((place_uri, SCHEMA.name, Literal(place.name)))

    g.add((instance_uri, RDF.type, SCHEMA.CourseInstance))
    g.add((instance_uri, SCHEMA.course, course_uri))
    g.add((instance_uri, SCHEMA.instructor, instr_uri))
    if instance.start_date is not None:
        g.add((instance_uri, SCHEMA.startDate,
               Literal(instance.start_date.isoformat(), datatype=XSD.date)))

    if instance.end_date is not None:
        g.add((instance_uri, SCHEMA.endDate,
               Literal(instance.end_date.isoformat(), datatype=XSD.date)))

    if getattr(instance, "term", None):
        g.add((instance_uri, EX_term, Literal(instance.term)))

    if getattr(instance, "maximum_enrollment", None) is not None:
        try:
            cap = int(instance.maximum_enrollment)
            g.add((instance_uri, SCHEMA.maximumAttendeeCapacity,
                   Literal(cap, datatype=XSD.integer)))
        except (ValueError, TypeError):
            pass

    if place_uri:
        g.add((instance_uri, SCHEMA.location, place_uri))

    return g