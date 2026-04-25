from bson import ObjectId

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound

from accounts.permissions import IsRadiologist, IsDoctor, IsAdmin
from .models import AiPredictions
from .serializers import AiPredictionsSerializer

class RunAiPredictionView(APIView):
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request):
        serializer = AiPredictionsSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


class AiPredictionsView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsAdmin | IsRadiologist)]

    def get(self, request, image_id):
        if not ObjectId.is_valid(image_id):
            raise NotFound("No inference result found for this image.")

        result = AiPredictions.objects(image=ObjectId(image_id)).first()
        if not result:
            raise NotFound("No inference result found for this image.")

        return Response(AiPredictionsSerializer(result).data, status=status.HTTP_200_OK)
