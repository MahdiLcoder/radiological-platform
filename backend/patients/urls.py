from django.urls import path
from . import views

urlpatterns = [
    path('', views.PatientListCreateView.as_view(), name='patient-list-create'),
    path('<str:pk>/', views.PatientDetailView.as_view(), name='patient-detail'),
]