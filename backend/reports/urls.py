from django.urls import path
from .views import GenerateReportView, ReportListView, ReportDetailView, ReportDownloadView

urlpatterns = [
    path('generate/', GenerateReportView.as_view(), name='generate-report'),
    path('', ReportListView.as_view(), name='list-reports'),
    path('<str:pk>/', ReportDetailView.as_view(), name='report-detail'),
    path('<str:pk>/download/', ReportDownloadView.as_view(), name='download-report'),
]
