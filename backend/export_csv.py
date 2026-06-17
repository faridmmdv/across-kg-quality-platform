import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

import csv
from api.models import CourseInstance

with open('course_instances.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(['instance_id', 'course_code', 'course_name', 'ects_credits',
                     'provider', 'start_date', 'end_date', 'instructor_name',
                     'instructor_email', 'location', 'description', 'enrollment'])
    
    for inst in CourseInstance.objects.select_related(
        'course', 'course__provider', 'instructor', 'location').all():
        writer.writerow([
            inst.id,
            inst.course.course_code,
            inst.course.name,
            inst.course.ects_credits,
            inst.course.provider.name,
            inst.start_date,
            inst.end_date,
            inst.instructor.name,
            inst.instructor.email or '',
            inst.location.name if inst.location else '',
            inst.course.description or '',
            inst.maximum_enrollment or '',
        ])

print('Done! Saved course_instances.csv')