from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/images/', include('images.urls')),
    path('api/inference/', include('inference.urls')),
    path('api/diagnosis/', include('diagnosis.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/patients/', include('patients.urls')),
]