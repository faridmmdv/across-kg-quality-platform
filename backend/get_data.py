import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import QualityReport, CourseInstance, University
from django.db.models import Avg

print('=== Quality Reports Summary ===')
reports = QualityReport.objects.all()
print(f'Total reports: {reports.count()}')
print(f'Passed: {reports.filter(overall="PASS").count()}')
print(f'Failed: {reports.filter(overall="FAIL").count()}')

print('\n=== Average FAIR Score per University ===')
for uni in University.objects.all():
    instances = CourseInstance.objects.filter(course__provider=uni)
    instance_ids = list(instances.values_list('id', flat=True))
    uni_reports = QualityReport.objects.filter(instance_id__in=instance_ids)
    if uni_reports.exists():
        avg = uni_reports.aggregate(Avg('fair_score'))
        print(f'{uni.name}: {avg["fair_score__avg"]:.4f}')

print('\n=== FAIR Dimension Averages ===')
f_scores, a_scores, i_scores, r_scores = [], [], [], []
for r in reports:
    fair = r.full_report.get('fair', {})
    if fair:
        f_scores.append(fair.get('F_score', 0))
        a_scores.append(fair.get('A_score', 0))
        i_scores.append(fair.get('I_score', 0))
        r_scores.append(fair.get('R_score', 0))
if f_scores:
    print(f'F avg: {sum(f_scores)/len(f_scores):.4f}')
    print(f'A avg: {sum(a_scores)/len(a_scores):.4f}')
    print(f'I avg: {sum(i_scores)/len(i_scores):.4f}')
    print(f'R avg: {sum(r_scores)/len(r_scores):.4f}')

print('\n=== Violations Summary ===')
total_shacl = sum(r.shacl_violations for r in reports)
total_sparql = sum(r.sparql_failed for r in reports)
print(f'Total SHACL violations: {total_shacl}')
print(f'Total SPARQL failures: {total_sparql}')

print('\n=== Per University Breakdown ===')
for uni in University.objects.all():
    instances = CourseInstance.objects.filter(course__provider=uni)
    instance_ids = list(instances.values_list('id', flat=True))
    uni_reports = QualityReport.objects.filter(instance_id__in=instance_ids)
    shacl = sum(r.shacl_violations for r in uni_reports)
    sparql = sum(r.sparql_failed for r in uni_reports)
    passed = uni_reports.filter(overall='PASS').count()
    failed = uni_reports.filter(overall='FAIL').count()
    avg = uni_reports.aggregate(Avg('fair_score'))
    print(f'{uni.name}:')
    print(f'  PASS={passed} FAIL={failed}')
    print(f'  SHACL violations={shacl}')
    print(f'  SPARQL failures={sparql}')
    print(f'  Avg FAIR score={avg["fair_score__avg"]:.4f}')

print('\n=== SPARQL Dimension Breakdown ===')
dim_counts = {}
for r in reports:
    sparql_results = r.full_report.get('sparql', {}).get('results', [])
    for test in sparql_results:
        if not test.get('passed'):
            dim = test.get('dimension', 'Unknown')
            dim_counts[dim] = dim_counts.get(dim, 0) + 1
for dim, count in sorted(dim_counts.items()):
    print(f'{dim}: {count} failures')

print('\n=== Top SHACL Violation Messages ===')
violation_messages = {}
for r in reports:
    for v in r.full_report.get('shacl', {}).get('violations', []):
        msg = v.get('message', 'Unknown')
        violation_messages[msg] = violation_messages.get(msg, 0) + 1
for msg, count in sorted(violation_messages.items(), key=lambda x: -x[1])[:5]:
    print(f'{count}: {msg}')