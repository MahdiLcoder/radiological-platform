from bson import ObjectId
from mongoengine.queryset.visitor import Q
from rest_framework import status, serializers
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsRadiologist, IsAdmin, IsDoctor
from patients.models import Patient
from .models import RadiologyImage
from .serializers import RadiologyImageSerializer


class ImageListQuerySerializer(serializers.Serializer):
    page = serializers.IntegerField(min_value=1, default=1)
    page_size = serializers.IntegerField(min_value=1, max_value=100, default=10)
    search = serializers.CharField(required=False, allow_blank=True, default="")
    modality = serializers.CharField(required=False, allow_blank=True, default="")
    status = serializers.CharField(required=False, allow_blank=True, default="", source="status_filter")


class ImageUploadView(APIView):
    
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request):
        serializer = RadiologyImageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ImageListView(APIView):

    permission_classes = [IsAuthenticated, (IsRadiologist | IsAdmin)]

    def get(self, request):
        query = ImageListQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        params = query.validated_data

        page = params["page"]
        page_size = params["page_size"]
        search = params["search"].strip().lower()
        modality = params["modality"]
        status_filter = params["status_filter"]

        images = RadiologyImage.objects.all()
        
        if hasattr(request.user, 'role') and request.user.role == 'radiologist':
            images = images.filter(uploaded_by_id=request.user.id)

        if modality:
            images = images.filter(modality__iexact=modality)
        if status_filter:
            images = images.filter(status__iexact=status_filter)

        if search:
            matching_patients = Patient.objects(
                Q(first_name__icontains=search) | 
                Q(last_name__icontains=search)
            )
            patient_ids = [p.id for p in matching_patients]
            
            if ObjectId.is_valid(search):
                obj_id = ObjectId(search)
                images = images.filter(Q(patient__in=patient_ids) | Q(id=obj_id))
            else:
                images = images.filter(patient__in=patient_ids)

        total = images.count()
        
        pending_count = images.filter(status__in=['uploaded', 'pending_analysis']).count()
        analyzed_count = images.filter(status__in=['analyzed', 'validated']).count()

        skip = (page - 1) * page_size
        images_paginated = images.skip(skip).limit(page_size)

        serializer = RadiologyImageSerializer(images_paginated, many=True)
        return Response({
            'count': total,
            'page': page,
            'page_size': page_size,
            'total_pages': max(1, (total + page_size - 1) // page_size),
            'stats': {
                'pending': pending_count,
                'analyzed': analyzed_count,
                'total': total
            },
            'results': serializer.data
        }, status=status.HTTP_200_OK)


class ImageDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), (IsDoctor | IsAdmin | IsRadiologist)()]
        elif self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        if not ObjectId.is_valid(pk):
            raise NotFound("Image not found!")

        image = RadiologyImage.objects(id=ObjectId(pk)).first()
        if not image:
            raise NotFound("Image not found!")
            
        if hasattr(request.user, 'role') and request.user.role == 'doctor':
            if not image.patient or image.patient.doctor_id != request.user.id:
                raise PermissionDenied("You do not have permission to access this image.")
        elif hasattr(request.user, 'role') and request.user.role == 'radiologist':
            if image.uploaded_by_id != request.user.id:
                raise PermissionDenied("You do not have permission to access this image.")
                
        serializer = RadiologyImageSerializer(image)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    def delete(self, request, pk):
        if not ObjectId.is_valid(pk):
            raise NotFound("Image not found!")

        image = RadiologyImage.objects(id=pk).first()
        if not image:
            raise NotFound("Image not found!")
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
