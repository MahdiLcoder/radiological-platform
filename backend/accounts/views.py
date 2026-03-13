from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .permissions import IsAdmin
from .serializers import RegisterSerializer, UserSerializer

from images.models import RadiologyImage
from inference.models import AiPredictions
from diagnosis.models import Diagnosis
from reports.models import Report

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user



class UserListView(generics.ListAPIView):

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')

        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        return qs


class ChangeRoleView(APIView):

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def patch(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        new_role = request.data.get('role')
        valid_roles = [r for r, _ in User.role.field.choices]
        if not new_role or new_role not in valid_roles:
            return Response(
                {"detail": f"Invalid role. Choose from: {valid_roles}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.role = new_role
        user.save()

        return Response(
            {
                "detail": f"Role updated to '{user.role}'.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class DeactivateUserView(APIView):

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user == request.user:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not user.is_active:
            return Response(
                {"detail": "User is already deactivated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save()

        return Response(
            {"detail": f"User '{user.username}' has been deactivated."},
            status=status.HTTP_200_OK,
        )


class SystemStatsView(APIView):

    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        user_qs = User.objects.all()

        role_counts = (
            user_qs.values('role')
            .annotate(count=Count('id'))
        )
        by_role = {item['role']: item['count'] for item in role_counts}

      

        stats = {
            "users": {
                "total": user_qs.count(),
                "active": user_qs.filter(is_active=True).count(),
                "inactive": user_qs.filter(is_active=False).count(),
                "by_role": {
                    "admin": by_role.get('admin', 0),
                    "radiologist": by_role.get('radiologist', 0),
                    "doctor": by_role.get('doctor', 0),
                },
            },
            "images": {
                "total": RadiologyImage.objects.count(),
            },
            "inferences": {
                "total": AiPredictions.objects.count(),
            },
            "diagnoses": {
                "total": Diagnosis.objects.count(),
            },
            "reports": {
                "total": Report.objects.count(),
            },
        }

        return Response(stats, status=status.HTTP_200_OK)
