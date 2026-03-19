from django.contrib.auth import get_user_model
from django.db.models import Count
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import AdminProfile, DoctorProfile, RadiologistProfile, UserRole

from .permissions import IsAdmin, IsRadiologist, IsDoctor
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


class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, (IsAdmin | IsRadiologist | IsDoctor)]

    def get_user(self, pk):
        try:
            return User.objects.get(pk=pk)
        except User.DoesNotExist:
            return None
        
    def patch(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        new_role = request.data.get('role')
        if new_role is not None:
            valid_roles = [r for r, _ in User.role.field.choices]
            if new_role not in valid_roles:
                return Response(
                    {"detail": f"Invalid role. Choose from: {valid_roles}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.role = new_role

        # Update other User fields
        allowed_user_fields = ['first_name', 'last_name', 'email', 'phone']
        for field in allowed_user_fields:
            if field in request.data:
                setattr(user, field, request.data[field])

        user.save()

        if user.role == UserRole.ADMIN:
            allowed = ['department']
            update_data = {f'set__{k}': v for k, v in request.data.items() if k in allowed}
            if update_data:
                AdminProfile.objects(user_id=user.id).update_one(**update_data)

        elif user.role == UserRole.RADIOLOGIST:
            allowed = ['medical_license_number', 'years_of_experience']
            update_data = {f'set__{k}': v for k, v in request.data.items() if k in allowed}
            if update_data:
                RadiologistProfile.objects(user_id=user.id).update_one(**update_data)

        elif user.role == UserRole.DOCTOR:
            allowed = ['specialty', 'medical_license_number', 'clinic']
            update_data = {f'set__{k}': v for k, v in request.data.items() if k in allowed}
            if update_data:
                DoctorProfile.objects(user_id=user.id).update_one(**update_data)

        return Response(
            {"detail": "User updated successfully.", "user": UserSerializer(user).data},
            status=status.HTTP_200_OK,
        )

    def delete(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response({"detail": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_200_OK)


class SystemStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        user_qs = User.objects.all()

        role_counts = user_qs.values('role').annotate(count=Count('id'))
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
            "images": {"total": RadiologyImage.objects.count()},
            "inferences": {"total": AiPredictions.objects.count()},
            "diagnoses": {"total": Diagnosis.objects.count()},
            "reports": {"total": Report.objects.count()},
        }

        return Response(stats, status=status.HTTP_200_OK)