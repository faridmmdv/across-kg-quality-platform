from rest_framework import serializers
from .models import University, Person, Place, Course, CourseInstance

class PersonInputSerializer(serializers.Serializer):
    name  = serializers.CharField(max_length=255, required=False, allow_blank=True, default="Unknown Instructor")
    email = serializers.CharField(required=False, allow_blank=True, allow_null=True, default=None)

class PlaceInputSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255, required=False, allow_blank=True, default="Unknown Location")

class CourseInputSerializer(serializers.Serializer):
    courseCode= serializers.CharField(max_length=100, required=False, allow_blank=True, default="UNKNOWN")
    name= serializers.CharField(max_length=500, required=False, allow_blank=True, default="Unknown Course")
    description= serializers.CharField(required=False, allow_blank=True, allow_null=True, default="")
    ectsCredits = serializers.IntegerField(required=False, allow_null=True, default=0)

class CourseInstanceInputSerializer(serializers.Serializer):
    startDate= serializers.CharField(required=False, allow_blank=True,allow_null=True, default=None)
    endDate= serializers.CharField(required=False, allow_blank=True,allow_null=True, default=None)
    term= serializers.CharField(max_length=100, required=False,allow_blank=True, allow_null=True,default=None)
    maximumEnrollment = serializers.IntegerField(required=False, allow_null=True,default=None)
    instructor = PersonInputSerializer(required=False, default={})
    location = PlaceInputSerializer(required=False, allow_null=True,default=None)

class SubmissionCreateSerializer(serializers.Serializer):
    providerName= serializers.CharField(max_length=255, required=False, default="TU Chemnitz")
    course= CourseInputSerializer(required=False, default={})
    courseInstance= CourseInstanceInputSerializer(required=False, default={})

    def create(self, validated_data):
        from datetime import datetime
        import uuid

        provider_name = validated_data.get("providerName") or "TU Chemnitz"
        course_data   = validated_data.get("course") or {}
        instance_data = validated_data.get("courseInstance") or {}
        uni, _ = University.objects.get_or_create(name=provider_name)
        instr_data= instance_data.get("instructor") or {}
        instr_name= instr_data.get("name") or "Unknown Instructor"
        instr_email = instr_data.get("email") or None
        if instr_email == "":
            instr_email = None
        instructor, _ = Person.objects.get_or_create(
            name=instr_name,
            defaults={"email": instr_email, "affiliation": uni},
        )
        if instructor.affiliation_id is None:
            instructor.affiliation = uni
            instructor.save(update_fields=["affiliation"])

        location = None
        loc_data = instance_data.get("location")
        if loc_data and loc_data.get("name"):
            location, _ = Place.objects.get_or_create(name=loc_data["name"])

        course_code = course_data.get("courseCode") or "UNKNOWN"
        course_name = course_data.get("name") or "Unknown Course"
        description = course_data.get("description") or ""
        ects = course_data.get("ectsCredits")
        try:
            ects = int(ects) if ects is not None else 0
        except (ValueError, TypeError):
            ects = 0

        unique_code = f"{course_code}-{uuid.uuid4().hex[:6].upper()}"

        course = Course.objects.create(
            provider=uni,
            course_code=unique_code,
            name=course_name,
            description=description,
            ects_credits=ects,
        )

        def parse_date(val):
            if not val:
                return None
            try:
                return datetime.strptime(str(val).strip(), "%Y-%m-%d").date()
            except Exception:
                return None

        start_date= parse_date(instance_data.get("startDate"))
        end_date = parse_date(instance_data.get("endDate"))

        max_enroll = instance_data.get("maximumEnrollment")
        try:
            max_enroll = int(max_enroll) if max_enroll is not None else None
        except (ValueError, TypeError):
            max_enroll = None

        instance = CourseInstance.objects.create(
            course=course,
            term=instance_data.get("term") or None,
            start_date=start_date,
            end_date=end_date,
            maximum_enrollment=max_enroll,
            instructor=instructor,
            location=location,
        )

        return instance

class CourseInstanceOutputSerializer(serializers.ModelSerializer):
    courseCode= serializers.SerializerMethodField()
    courseName  = serializers.CharField(source="course.name")
    providerName = serializers.CharField(source="course.provider.name")
    instructorName = serializers.CharField(source="instructor.name")
    instructorEmail= serializers.CharField(source="instructor.email", allow_null=True)
    locationName= serializers.SerializerMethodField()

    class Meta:
        model  = CourseInstance
        fields = [
            "id", "providerName", "courseCode", "courseName",
            "term", "start_date", "end_date", "maximum_enrollment",
            "instructorName", "instructorEmail", "locationName", "created_at",
        ]

    def get_courseCode(self, obj):
        code = obj.course.course_code or ""
        if "-" in code:
            parts = code.rsplit("-", 1)
            if len(parts[1]) == 6 and parts[1].isupper():
                return parts[0]
        return code

    def get_locationName(self, obj):
        return obj.location.name if obj.location else None