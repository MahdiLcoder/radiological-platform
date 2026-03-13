from django.urls import path
from .views import DiagnosisCreateView, DiagnosisRetrieveUpdateView

urlpatterns = [
    path('', DiagnosisCreateView.as_view(), name='diagnosis-create'),
    path('<str:pk>/', DiagnosisRetrieveUpdateView.as_view(), name='diagnosis-detail-update'),
]
