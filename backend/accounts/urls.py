from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    ForgotPasswordView,
    MeView,
    ProfileImageUploadView,
    RegisterView,
    SystemStatsView,
    UserDetailView,
    UserListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
    path('me/upload-image/', ProfileImageUploadView.as_view()),

    path('users/', UserListView.as_view()),
    path('users/<int:pk>/', UserDetailView.as_view()),

    path('stats/', SystemStatsView.as_view()),
    path('forgot-password/', ForgotPasswordView.as_view()),
]