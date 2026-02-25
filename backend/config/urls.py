# config/urls.py
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/auth/', include('accounts.urls')),
    path('api/images/', include('images.urls')),
    path('api/inference/', include('inference.urls')),
    path('api/diagnosis/', include('diagnosis.urls')),
    path('api/reports/', include('reports.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
