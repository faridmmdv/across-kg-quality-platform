import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import QualityReport, CourseInstance, University
from django.db.models import Avg

print('=== Instances per University ===')
for uni in University.objects.all():
    count = CourseInstance.objects.filter(course__provider=uni).count()
    print(f'{uni.name}: {count} instances')

print('\n=== Quality Reports Summary ===')
reports = QualityReport.objects.all()
print(f'Total reports: {reports.count()}')
print(f'Passed: {reports.filter(passed=True).count()}')
print(f'Failed: {reports.filter(passed=False).count()}')

print('\n=== Average FAIR Score per University ===')
for uni in University.objects.all():
    avg = QualityReport.objects.filter(
        course_instance__course__provider=uni
    ).aggregate(Avg('fair_score'))
    score = avg['fair_score__avg']
    if score:
        print(f'{uni.name}: {score:.4f}')
    else:
        print(f'{uni.name}: no data')

print('\n=== Violations Summary ===')
total_violations = sum(r.shacl_violations for r in reports)
total_sparql = sum(r.sparql_failures for r in reports)
print(f'Total SHACL violations: {total_violations}')
print(f'Total SPARQL failures: {total_sparql}')