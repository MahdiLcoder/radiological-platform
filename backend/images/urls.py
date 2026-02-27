from django.urls import path
from .views import ImageUploadView, ImageListView, ImageDetailView

urlpatterns = [
    path('upload/', ImageUploadView.as_view(), name='image-upload'),
    path('', ImageListView.as_view(), name='image-list'),
    path('<str:pk>/', ImageDetailView.as_view(), name='image-detail'),
]
