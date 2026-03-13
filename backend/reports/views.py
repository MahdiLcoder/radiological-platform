from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, APIException
from accounts.permissions import IsRadiologist, IsDoctor, IsAdmin
from diagnosis.models import Diagnosis
from images.models import RadiologyImage
from .models import Report
from .serializers import ReportSerializer
from .services import PDFService
import cloudinary.uploader
import io
import logging
from django.http import HttpResponse

logger = logging.getLogger(__name__)

class GenerateReportView(APIView):
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request):
        serializer = ReportSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        report = serializer.save()
        
        return Response(ReportSerializer(report).data, status=status.HTTP_201_CREATED)

class ReportListView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsRadiologist | IsAdmin)]

    def get(self, request):
        try:
            reports = Report.objects.all()
            serializer = ReportSerializer(reports, many=True)
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
            serializer = ReportSerializer(report)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error fetching report: {e}", exc_info=True)
            raise APIException("Failed to fetch report")

class ReportDownloadView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsRadiologist | IsAdmin)]

    def get(self, request, pk):
        try:
            report = Report.objects(id=pk).first()
            if not report:
                raise NotFound("Report not found")
            
            if not report.pdf_path:
                return Response({"error": "PDF not generated for this report"}, status=status.HTTP_404_NOT_FOUND)
                
            import requests
            pdf_resp = requests.get(report.pdf_path)
            if pdf_resp.status_code == 200:
                response = HttpResponse(pdf_resp.content, content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="report_{pk}.pdf"'
                return response
            else:
                return Response({"error": "Failed to download PDF from storage"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error downloading report: {e}", exc_info=True)
            raise APIException("Failed to download report")
