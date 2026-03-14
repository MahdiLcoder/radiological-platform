from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    MeView,
    RegisterView,
    SystemStatsView,
    UpdateUserView,
    UserListView,
)

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('login/', TokenObtainPairView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),

    path('users/', UserListView.as_view()),
    path('users/<int:pk>/', UpdateUserView.as_view()),

    path('stats/', SystemStatsView.as_view()),
]