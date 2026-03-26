import logging
from bson import ObjectId
from mongoengine.queryset.visitor import Q
from rest_framework import status
from rest_framework.exceptions import NotFound, APIException, PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsRadiologist, IsAdmin, IsDoctor
from patients.models import Patient
from .models import RadiologyImage
from .serializers import RadiologyImageSerializer

logger = logging.getLogger(__name__)


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
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
            search = request.query_params.get('search', '').strip().lower()
            modality = request.query_params.get('modality', '')
            status_filter = request.query_params.get('status', '')

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
                
                try:
                    obj_id = ObjectId(search)
                    images = images.filter(Q(patient__in=patient_ids) | Q(id=obj_id))
                except Exception:
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
        except Exception as e:
            logger.error(f"Error in ImageListView: {e}", exc_info=True)
            raise APIException("Something went wrong")


class ImageDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), (IsDoctor | IsAdmin | IsRadiologist)()]
        elif self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
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
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in ImageDetailView: {e}", exc_info=True)
            raise APIException("Something went wrong")
        
    def delete(self, request, pk):
        try:
            image = RadiologyImage.objects(id=pk).first()
            if not image:
                raise NotFound("Image not found!")
            image.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in ImageDetailView: {e}", exc_info=True)
            raise APIException("Something went wrong")
