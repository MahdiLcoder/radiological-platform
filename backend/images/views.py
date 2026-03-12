from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import NotFound, APIException
from .serializers import RadiologyImageSerializer
from .models import RadiologyImage
from accounts.permissions import IsRadiologist, IsAdmin, IsDoctor
import logging

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
            images = RadiologyImage.objects.all()
            serializer = RadiologyImageSerializer(images, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error in ImageListView: {e}", exc_info=True)
            raise APIException("Something went wrong")


class ImageDetailView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsDoctor()]
        elif self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get(self, request, pk):
        try:
            image = RadiologyImage.objects(id=pk).first()
            if not image:
                raise NotFound("Image not found!")
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