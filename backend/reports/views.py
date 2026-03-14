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
            reports = Report.objects.all()
            serializer = ReportSerializer(reports, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
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