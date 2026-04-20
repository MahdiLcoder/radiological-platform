from django.urls import path
from .views import DiagnosisCreateView

urlpatterns = [
    path('', DiagnosisCreateView.as_view(), name='diagnosis-create'),
]
