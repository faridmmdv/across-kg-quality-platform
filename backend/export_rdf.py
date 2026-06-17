"""
export_rdf.py
-------------
Exports RDF graphs from Django DB into per-university TTL files
so they can be loaded into the three Fuseki servers.

Place this file in:
    C:\\Users\\HP\\Desktop\\university\\backend\\

Run:
    cd C:\\Users\\HP\\Desktop\\university\\backend
    python export_rdf.py

Output:
    data\\rdf\\tuc.ttl
    data\\rdf\\girona.ttl
    data\\rdf\\udine.ttl
"""

import os
import sys
import django
from pathlib import Path
from rdflib import Graph

# ── Django setup ──────────────────────────────────────────────────
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from api.models import CourseInstance
from api.api.quality_engine.rdf_builder import build_graph_from_instance

# ── University name → output file mapping ─────────────────────────
UNIVERSITIES = {
    "TU Chemnitz":          "tuc.ttl",
    "University of Girona": "girona.ttl",
    "University of Udine":  "udine.ttl",
}

OUTPUT_DIR = Path("data") / "rdf"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def export_rdf():
    instances = CourseInstance.objects.select_related(
        "course",
        "course__provider",
        "instructor",
        "instructor__affiliation",
        "location",
    ).all()

    total = instances.count()
    print(f"Found {total} CourseInstances in DB")

    if total == 0:
        print("No data found! Upload CSV data first via the Django UI.")
        return

    # Build one merged graph per university
    graphs = {uni: Graph() for uni in UNIVERSITIES}

    for i, instance in enumerate(instances, start=1):
        uni_name = instance.course.provider.name
        if uni_name not in graphs:
            print(f"  Warning: unknown university '{uni_name}' — skipping instance {instance.id}")
            continue
        try:
            g = build_graph_from_instance(instance)
            for triple in g:
                graphs[uni_name].add(triple)
        except Exception as e:
            print(f"  Skipping instance {instance.id}: {e}")

        if i % 50 == 0:
            print(f"  Processed {i}/{total}...")

    # Serialize each graph to TTL
    print()
    for uni_name, filename in UNIVERSITIES.items():
        g = graphs[uni_name]
        out_path = OUTPUT_DIR / filename
        g.serialize(destination=str(out_path), format="turtle")
        print(f"  {uni_name:25s} → {out_path}  ({len(g)} triples)")

    print()
    print(f"Done! TTL files written to: {OUTPUT_DIR.resolve()}")
    print("Now run load_fuseki.bat to push them into Fuseki.")


if __name__ == "__main__":
    export_rdf()