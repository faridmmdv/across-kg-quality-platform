from django.db import models

class University(models.Model):
    name = models.CharField(max_length=255, unique=True)
    def __str__(self):
        return self.name

class Person(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, null=True)
    affiliation = models.ForeignKey(
        University, on_delete=models.SET_NULL, null=True, blank=True, related_name="people")

    class Meta:
        unique_together = ("name", "email")
    def __str__(self):
        return self.name
class Place(models.Model):
    name = models.CharField(max_length=255, unique=True)
    def __str__(self):
        return self.name

class Course(models.Model):
    provider = models.ForeignKey(University, on_delete=models.CASCADE, related_name="courses")
    course_code = models.CharField(max_length=50)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    ects_credits = models.PositiveIntegerField()

    class Meta:
        unique_together = ("provider", "course_code")

    def __str__(self):
        return f"{self.course_code} - {self.name}"

class CourseInstance(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name="instances")
    term = models.CharField(max_length=50, blank=True, null=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    maximum_enrollment = models.PositiveIntegerField(blank=True, null=True)
    instructor = models.ForeignKey(Person, on_delete=models.PROTECT, related_name="course_instances")
    location = models.ForeignKey(Place, on_delete=models.SET_NULL, null=True, blank=True, related_name="course_instances")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Instance of {self.course.course_code} ({self.term or 'no-term'})"

class QualityReport(models.Model):
    instance= models.OneToOneField(CourseInstance, on_delete=models.CASCADE, related_name="quality_report")
    overall= models.CharField(max_length=10)
    fair_score = models.FloatField()
    shacl_violations = models.IntegerField()
    sparql_failed= models.IntegerField()
    full_report= models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"QualityReport [{self.overall}] for {self.instance}"