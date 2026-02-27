from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from .serializers import RadiologyImageSerializer
from .models import RadiologyImage
from accounts.permissions import IsRadiologist, IsAdmin, IsDoctor


class ImageUploadView(APIView):
    """
    POST /api/images/upload/ -> Radiologist only
    """
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request):
        serializer = RadiologyImageSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ImageListView(APIView):
    """
    GET /api/images/ -> Radiologist or Admin
    """
    permission_classes = [IsAuthenticated, (IsRadiologist | IsAdmin)]

    def get(self, request):
        images = RadiologyImage.objects.all()
        serializer = RadiologyImageSerializer(images, many=True)
        return Response(serializer.data)


class ImageDetailView(APIView):
    """
    GET    /api/images/<id>/ -> Radiologist, Doctor, or Admin (covered by IsDoctor)
    DELETE /api/images/<id>/ -> Admin only
    """
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated(), IsDoctor()]
        elif self.request.method == 'DELETE':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        try:
            return RadiologyImage.objects.get(id=pk)
        except RadiologyImage.DoesNotExist:
            raise Http404

    def get(self, request, pk):
        image = self.get_object(pk)
        serializer = RadiologyImageSerializer(image)
        return Response(serializer.data)

    def delete(self, request, pk):
        image = self.get_object(pk)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)