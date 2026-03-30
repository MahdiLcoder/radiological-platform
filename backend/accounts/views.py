import secrets
import string
import logging

from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
import cloudinary.uploader

from config.email_utils import send_password_reset_email

from .permissions import IsAdmin, IsRadiologist, IsDoctor
from .serializers import RegisterSerializer, UserSerializer

from images.models import RadiologyImage
from inference.models import AiPredictions
from diagnosis.models import Diagnosis
from reports.models import Report
from rest_framework.pagination import PageNumberPagination

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



class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination


    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')

        role = self.request.query_params.get('role')
        if role:
            qs = qs.filter(role=role)

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search)
            )

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

        serializer = UserSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user = self.get_user(pk)
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user == request.user:
            return Response({"detail": "You cannot delete your own account."}, status=status.HTTP_400_BAD_REQUEST)

        user.delete()
        return Response({"detail": "User deleted successfully."}, status=status.HTTP_200_OK)



class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip()

        if not email:
            return Response(
                {"detail": "Email address is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "No account found with this email address. Please check and try again."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Generate a secure 12-character random password
        alphabet = string.ascii_letters + string.digits + string.punctuation.replace('"', '').replace("'", '')
        new_password = ''.join(secrets.choice(alphabet) for _ in range(12))

        user.set_password(new_password)
        user.save(update_fields=['password'])

        send_password_reset_email(user, new_password)

        return _GENERIC_RESPONSE


logger = logging.getLogger(__name__)


class ProfileImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')

        if not image_file:
            return Response(
                {"detail": "No image file provided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not image_file.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            return Response(
                {"detail": "Invalid file extension. Allowed: jpg, jpeg, png."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder=f"profile_images/{request.user.id}",
                resource_type='image',
                transformation=[
                    {'width': 256, 'height': 256, 'crop': 'fill', 'gravity': 'face'}
                ],
            )
            image_url = upload_result["secure_url"]

            request.user.profile_image = image_url
            request.user.save(update_fields=['profile_image'])

            return Response({"profile_image": image_url}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error uploading profile image: {e}", exc_info=True)
            return Response(
                {"detail": "Failed to upload profile image."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


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