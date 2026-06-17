"""
export_triples.py
-----------------
Place this file in:
    C:\\Users\\HP\\Desktop\\university\\backend\\

Then run:
    cd C:\\Users\\HP\\Desktop\\university\\backend
    python export_triples.py

Output: triples_pykeen.tsv in the same folder
"""

import os
import sys
import django

# Django setup
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

# Imports after Django setup
from api.models import CourseInstance
from api.api.quality_engine.rdf_builder import build_graph_from_instance

OUTPUT_FILE = "triples_pykeen.tsv"


def export_triples():
    instances = CourseInstance.objects.select_related(
        "course",
        "course__provider",
        "instructor",
        "instructor__affiliation",
        "location",
    ).all()

    total_instances = instances.count()
    print(f"Found {total_instances} CourseInstances in DB")

    if total_instances == 0:
        print("No data found! Make sure you uploaded CSVs first.")
        return

    all_triples = set()  # deduplicate

    for i, instance in enumerate(instances, start=1):
        try:
            g = build_graph_from_instance(instance)
            for s, p, o in g:
                all_triples.add((str(s), str(p), str(o)))
        except Exception as e:
            print(f"  Skipping instance {instance.id}: {e}")

        if i % 50 == 0:
            print(f"  Processed {i}/{total_instances} instances...")

    print(f"\nTotal unique triples: {len(all_triples)}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        for s, p, o in sorted(all_triples):
            f.write(f"{s}\t{p}\t{o}\n")

    print(f"\nDone! Saved to: {OUTPUT_FILE}")
    print("\nSample triples:")
    sample = list(all_triples)[:5]
    for s, p, o in sample:
        print(f"  {s[:50]}  |  {p.split('/')[-1]}  |  {o[:40]}")


if __name__ == "__main__":
    export_triples()