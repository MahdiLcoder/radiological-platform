from bson import ObjectId
from mongoengine.queryset.visitor import Q
from rest_framework import status, serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from diagnosis.models import Diagnosis
from images.models import RadiologyImage
from accounts.permissions import IsDoctor, IsRadiologist
from .models import Patient
from .serializers import PatientSerializer


class PatientListQuerySerializer(serializers.Serializer):
    tab = serializers.ChoiceField(choices=["ALL", "RECENT", "PRIORITY"], default="ALL")
    search = serializers.CharField(required=False, allow_blank=True, default="")
    page = serializers.IntegerField(min_value=1, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=100, default=10)


class PatientListCreateView(APIView):

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsDoctor()]
        return [IsAuthenticated(), (IsDoctor | IsRadiologist)()]

    def get(self, request):
        params = PatientListQuerySerializer(data=request.query_params)
        params.is_valid(raise_exception=True)

        tab = params.validated_data['tab']
        search = params.validated_data['search'].lower().strip()
        page = params.validated_data['page']
        page_size = params.validated_data['page_size']

        if request.user.role == 'radiologist':
            patients = Patient.objects.all()
        else:
            patients = Patient.objects(doctor_id=request.user.id)

        if search:
            patients = patients.filter(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search) |
                Q(cin__icontains=search)
            )

        if tab == 'RECENT':
            patients = patients.order_by('-created_at')
        elif tab == 'PRIORITY':
            diags = Diagnosis.objects.all()
            images_with_diags = [d.image.id for d in diags if getattr(d, 'image', None)]
            all_images = RadiologyImage.objects(id__in=images_with_diags)
            patient_ids_with_diags = [img.patient.id for img in all_images if getattr(img, 'patient', None)]
            patients = patients.filter(id__in=patient_ids_with_diags)

        total = patients.count()
        skip = (page - 1) * page_size
        patients_paginated = patients.skip(skip).limit(page_size)

        serializer = PatientSerializer(patients_paginated, many=True)
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': max(1, (total + page_size - 1) // page_size),
            'results': serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = PatientSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PatientDetailView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get_object(self, cin):
        patient = Patient.objects(cin=cin).first()
        if not patient:
            raise NotFound("Patient not found")

        if patient.doctor_id == self.request.user.id:
            return patient

        raise PermissionDenied("You do not have permission to access this patient.")

    def get(self, request, cin):
        patient = self.get_object(cin)

        scan_order = request.query_params.get('scan_order', 'desc')
        order_field = 'uploaded_at' if scan_order == 'asc' else '-uploaded_at'
        images = RadiologyImage.objects.filter(patient=patient).order_by(order_field)
        diagnoses = Diagnosis.objects.filter(image__in=[img.id for img in images]).order_by('-validated_at')
        
        last_visit = None
        if images.first():
            last_visit = images.first().uploaded_at
        if diagnoses.first() and (not last_visit or diagnoses.first().validated_at > last_visit):
            last_visit = diagnoses.first().validated_at

        patient_data = PatientSerializer(patient).data
        patient_data['last_visit'] = last_visit.isoformat() if last_visit else None
        
        patient_data['stats'] = {
            'total_scans': images.count(),
            'active_diagnoses': diagnoses.count()
        }

        patient_data['recent_scans'] = [
            {
                'id': str(img.id),
                'modality': img.modality,
                'uploaded_at': img.uploaded_at.isoformat() if img.uploaded_at else None,
                'status': img.status,
                'file_path': img.file_path
            } for img in images[:5]
        ]

        patient_data['active_diagnoses_list'] = [
            {
                'id': str(diag.id),
                'final_finding': diag.final_finding,
                'clinical_notes': diag.clinical_notes,
                'validated_at': diag.validated_at.isoformat() if diag.validated_at else None,
                'severity': 'high' if 'severe' in (diag.final_finding or '').lower() else 'normal'
            } for diag in diagnoses[:5]
        ]

        return Response(patient_data, status=status.HTTP_200_OK)

    def patch(self, request, cin):
        patient = self.get_object(cin)

        serializer = PatientSerializer(patient, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
