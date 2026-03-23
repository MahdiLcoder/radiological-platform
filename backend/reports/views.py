import logging
from django.http import HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, APIException
from accounts.permissions import IsRadiologist, IsDoctor, IsAdmin
from .models import Report
from .serializers import ReportSerializer
from diagnosis.models import Diagnosis
from images.models import RadiologyImage


logger = logging.getLogger(__name__)


class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request):
        serializer = ReportSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        diag_id = serializer.validated_data.get('diagnosis_id')
        diagnosis = Diagnosis.objects(id=diag_id).first()
        existing = Report.objects(diagnosis=diagnosis).first() if diagnosis else None
        already_exists = existing and existing.pdf_data

        report = serializer.save()

        response_status = status.HTTP_200_OK if already_exists else status.HTTP_201_CREATED
        return Response(
            ReportSerializer(report, context={'request': request}).data,
            status=response_status
        )


class ReportListView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsRadiologist | IsAdmin)]

    def get(self, request):
        try:
            modality = request.query_params.get('modality', '')
            search = request.query_params.get('search', '').lower().strip()
            date_range = request.query_params.get('date_range', '')
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))

            reports = Report.objects.all()

            # Doctors only see reports for their own patients
            if hasattr(request.user, 'role') and request.user.role == 'doctor':
                from patients.models import Patient
                from images.models import RadiologyImage
                doctor_patients = Patient.objects(doctor_id=request.user.id)
                patient_ids = [p.id for p in doctor_patients]
                doctor_images = RadiologyImage.objects(patient__in=patient_ids)
                image_ids = [img.id for img in doctor_images]
                reports = reports.filter(image__in=image_ids)
            elif hasattr(request.user, 'role') and request.user.role == 'radiologist':
                reports = reports.filter(generated_by=request.user.id)

            if date_range == 'Last 7 Days':
                import datetime
                threshold = datetime.datetime.utcnow() - datetime.timedelta(days=7)
                reports = reports.filter(generated_at__gte=threshold)
            elif date_range == 'Last 30 Days':
                import datetime
                threshold = datetime.datetime.utcnow() - datetime.timedelta(days=30)
                reports = reports.filter(generated_at__gte=threshold)

            if modality or search:
                from images.models import RadiologyImage
                from patients.models import Patient
                from mongoengine.queryset.visitor import Q

                image_qs = RadiologyImage.objects.all()
                if modality and modality != 'All Modalities':
                    image_qs = image_qs.filter(modality__iexact=modality)
                
                if search:
                    matching_patients = Patient.objects(
                        Q(first_name__icontains=search) | 
                        Q(last_name__icontains=search)
                    )
                    patient_ids = [p.id for p in matching_patients]
                    
                    try:
                        from bson import ObjectId
                        obj_id = ObjectId(search)
                        image_qs = image_qs.filter(Q(patient__in=patient_ids) | Q(id=obj_id))
                    except Exception:
                        image_qs = image_qs.filter(patient__in=patient_ids)

                matching_images = [img.id for img in image_qs]
                reports = reports.filter(image__in=matching_images)

            total = reports.count()
            skip = (page - 1) * page_size
            reports_paginated = reports.skip(skip).limit(page_size)

            serializer = ReportSerializer(reports_paginated, many=True, context={'request': request})
            return Response({
                'count': total,
                'page': page,
                'page_size': page_size,
                'total_pages': max(1, (total + page_size - 1) // page_size),
                'results': serializer.data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching reports: {e}", exc_info=True)
            raise APIException("Failed to fetch reports")


class ReportDetailView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsRadiologist | IsAdmin)]

    def get(self, request, pk):
        try:
            report = Report.objects(id=pk).first()
            if not report:
                raise NotFound("Report not found")
                
            if hasattr(request.user, 'role') and request.user.role == 'doctor':
                from rest_framework.exceptions import PermissionDenied
                if not report.image or not report.image.patient or report.image.patient.doctor_id != request.user.id:
                    raise PermissionDenied("You do not have permission to access this report.")
            elif hasattr(request.user, 'role') and request.user.role == 'radiologist':
                from rest_framework.exceptions import PermissionDenied
                if report.generated_by != request.user.id:
                    raise PermissionDenied("You do not have permission to access this report.")
                    
            serializer = ReportSerializer(report, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error fetching report {pk}: {e}", exc_info=True)
            raise APIException("Failed to fetch report")


class ReportDownloadView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsRadiologist | IsAdmin)]

    def get(self, request, pk):
        try:
            report = Report.objects(id=pk).first()
            if not report:
                raise NotFound("Report not found")

            if hasattr(request.user, 'role') and request.user.role == 'doctor':
                from rest_framework.exceptions import PermissionDenied
                if not report.image or not report.image.patient or report.image.patient.doctor_id != request.user.id:
                    raise PermissionDenied("You do not have permission to download this report.")
            elif hasattr(request.user, 'role') and request.user.role == 'radiologist':
                from rest_framework.exceptions import PermissionDenied
                if report.generated_by != request.user.id:
                    raise PermissionDenied("You do not have permission to download this report.")

            if not report.pdf_data:
                return Response(
                    {"error": "PDF not generated for this report"},
                    status=status.HTTP_404_NOT_FOUND
                )

            response = HttpResponse(bytes(report.pdf_data), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="report_{pk}.pdf"'
            return response

        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error downloading report {pk}: {e}", exc_info=True)
            raise APIException("Failed to download report")


class ReportByImageView(APIView):
    """Return the report associated with a given radiology image ID."""
    permission_classes = [IsAuthenticated, (IsDoctor | IsRadiologist | IsAdmin)]

    def get(self, request, image_id):
        try:
            image = RadiologyImage.objects(id=image_id).first()
            if not image:
                raise NotFound("Image not found")

            if hasattr(request.user, 'role') and request.user.role == 'doctor':
                from rest_framework.exceptions import PermissionDenied
                if not image.patient or image.patient.doctor_id != request.user.id:
                    raise PermissionDenied("You do not have permission to access this report.")
            elif hasattr(request.user, 'role') and request.user.role == 'radiologist':
                from rest_framework.exceptions import PermissionDenied
                if image.uploaded_by_id != request.user.id:
                    raise PermissionDenied("You do not have permission to access this report.")

            report = Report.objects(image=image).first()
            if not report:
                raise NotFound("No report found for this image")

            serializer = ReportSerializer(report, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error finding report for image {image_id}: {e}", exc_info=True)
            raise APIException("Failed to fetch report")