from django.urls import path
from .views import SubmissionListCreateView, run_quality, bulk_upload, federation_report, fuseki_status

urlpatterns = [
    path("submissions/", SubmissionListCreateView.as_view(), name="submissions"),
    path("submissions/bulk/", bulk_upload, name="bulk-upload"),
    path("submissions/<int:instance_id>/run-quality/", run_quality,name="run-quality"),
    path("federation/report/", federation_report, name="federation-report"),
    path("federation/status/", fuseki_status, name="fuseki-status"),
]