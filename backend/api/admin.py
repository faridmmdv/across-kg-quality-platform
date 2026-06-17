from django.contrib import admin
from .models import University, Person, Place, Course, CourseInstance, QualityReport


@admin.register(University)
class UniversityAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "affiliation"]
    search_fields = ["name", "email"]
    list_filter = ["affiliation"]


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ["name"]
    search_fields = ["name"]


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ["course_code", "name", "provider", "ects_credits"]
    search_fields = ["course_code", "name"]
    list_filter = ["provider"]


@admin.register(CourseInstance)
class CourseInstanceAdmin(admin.ModelAdmin):
    list_display = ["course", "term", "start_date", "end_date", "instructor", "location", "created_at"]
    search_fields = ["course__course_code", "course__name", "instructor__name"]
    list_filter = ["course__provider", "term"]
    ordering = ["-created_at"]


@admin.register(QualityReport)
class QualityReportAdmin(admin.ModelAdmin):
    list_display = ["instance", "overall", "fair_score", "shacl_violations", "sparql_failed", "created_at"]
    search_fields = ["instance__course__course_code", "instance__course__name"]
    list_filter = ["overall", "instance__course__provider"]
    ordering = ["-created_at"]
    readonly_fields = ["full_report", "created_at"]