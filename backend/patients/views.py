from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, APIException

from accounts.permissions import IsDoctor, IsAdmin
from .models import Patient
from .serializers import PatientSerializer

from images.models import RadiologyImage
from diagnosis.models import Diagnosis
from reports.models import Report


class PatientListCreateView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsAdmin)]

    def get(self, request):
        """List patients managed by the current doctor"""
        try:
            # Doctors can see patients they manage, admins can see all
            if request.user.role == 'admin':
                patients = Patient.objects.all()
            else:
                patients = Patient.objects(doctor_id=request.user.id)

            serializer = PatientSerializer(patients, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """Create a new patient record"""
        try:
            serializer = PatientSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                patient = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientDetailView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsAdmin)]

    def get_object(self, pk):
        """Get patient by ID with permission check"""
        try:
            patient = Patient.objects(id=pk).first()
            if not patient:
                return None

            # Check permissions
            if self.request.user.role == 'admin' or patient.doctor_id == self.request.user.id:
                return patient
            return None
        except:
            return None

    def get(self, request, pk):
        """Get patient details with related medical records"""
        patient = self.get_object(pk)
        if not patient:
            return Response({"error": "Patient not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

        try:
            # Get related records - this is the main value: linking all medical data to patients
            images = RadiologyImage.objects.filter(patient=patient)
            diagnoses = Diagnosis.objects.filter(image__in=[img.id for img in images])
            reports = Report.objects.filter(image__in=[img.id for img in images])

            patient_data = PatientSerializer(patient).data
            patient_data['medical_records'] = {
                'images_count': images.count(),
                'diagnoses_count': diagnoses.count(),
                'reports_count': reports.count(),
                'recent_images': [
                    {
                        'id': str(img.id),
                        'modality': img.modality,
                        'uploaded_at': img.uploaded_at.isoformat() if img.uploaded_at else None,
                        'status': img.status
                    } for img in images.order_by('-uploaded_at')[:5]
                ],
                'recent_diagnoses': [
                    {
                        'id': str(diag.id),
                        'final_finding': diag.final_finding,
                        'validated_at': diag.validated_at.isoformat() if diag.validated_at else None
                    } for diag in diagnoses.order_by('-validated_at')[:5]
                ]
            }

            return Response(patient_data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk):
        """Update patient record"""
        patient = self.get_object(pk)
        if not patient:
            return Response({"error": "Patient not found or access denied"}, status=status.HTTP_404_NOT_FOUND)

        try:
            serializer = PatientSerializer(patient, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        """Delete patient record (admin only)"""
        if request.user.role != 'admin':
            return Response({"error": "Only administrators can delete patient records"}, status=status.HTTP_403_FORBIDDEN)

        patient = self.get_object(pk)
        if not patient:
            return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            patient.delete()
            return Response({"message": "Patient record deleted"}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
