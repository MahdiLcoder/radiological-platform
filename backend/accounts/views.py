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
    permission_classes = [permissions.IsAuthenticated, IsAdmin]


class MeView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    pagination_class = StandardResultsSetPagination


    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')

        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)

        return qs



class UserDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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

        new_password = request.data.get('new_password')
        old_password = request.data.get('old_password')

        if new_password:
            if not old_password:
                return Response(
                    {"detail": "Old password is required to set a new password."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.check_password(old_password):
                return Response(
                    {"detail": "Incorrect old password."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user.set_password(new_password)

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


from datetime import datetime, timedelta

class SystemStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        user_qs = User.objects.all()

        role_counts = user_qs.values('role').annotate(count=Count('id'))
        by_role = {item['role']: item['count'] for item in role_counts}

        # Modality distribution
        pipeline_modality = [
            {"$group": {"_id": "$modality", "count": {"$sum": 1}}}
        ]
        modality_dist_raw = list(RadiologyImage.objects.aggregate(pipeline_modality))
        modality_dist = {item['_id']: item['count'] for item in modality_dist_raw if item['_id']}
        
        # Status distribution
        pipeline_status = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_dist_raw = list(RadiologyImage.objects.aggregate(pipeline_status))
        status_dist = {item['_id'] if item['_id'] else 'pending': item['count'] for item in status_dist_raw}

        # Scans trend (Last 7 days)
        now = datetime.utcnow()
        scans_trend = []
        for i in range(6, -1, -1):
            day = now - timedelta(days=i)
            start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
            count = RadiologyImage.objects(uploaded_at__gte=start, uploaded_at__lte=end).count()
            scans_trend.append({"date": day.strftime("%Y-%m-%d"), "count": count})

        # Top findings from AI
        pipeline_findings = [
            {"$group": {"_id": "$top_finding", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 5}
        ]
        findings_raw = list(AiPredictions.objects.aggregate(pipeline_findings))
        top_findings = [
            {"name": item['_id'], "value": item['count']} 
            for item in findings_raw if item['_id']
        ]

        # Average confidence
        pipeline_confidence = [
            {"$group": {"_id": None, "avg_conf": {"$avg": "$confidence"}}}
        ]
        conf_raw = list(AiPredictions.objects.aggregate(pipeline_confidence))
        avg_confidence = conf_raw[0]['avg_conf'] if conf_raw else 0

        stats = {
            "users": {
                "total": user_qs.count(),
                "by_role": {
                    "admin": by_role.get('admin', 0),
                    "radiologist": by_role.get('radiologist', 0),
                    "doctor": by_role.get('doctor', 0),
                },
            },
            "images": {
                "total": RadiologyImage.objects.count(),
                "by_modality": modality_dist,
                "by_status": status_dist,
                "trend": scans_trend
            },
            "findings": {
                "top": top_findings,
                "avg_confidence": avg_confidence
            },
            "inferences": {"total": AiPredictions.objects.count()},
            "diagnoses": {"total": Diagnosis.objects.count()},
            "reports": {"total": Report.objects.count()},
        }


        return Response(stats, status=status.HTTP_200_OK)