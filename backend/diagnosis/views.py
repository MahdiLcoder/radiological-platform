from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.permissions import IsRadiologist, IsDoctor, IsAdmin

from bson import ObjectId

from .models import Diagnosis
from .serializers import DiagnosisSerializer
from images.models import RadiologyImage




class DiagnosisCreateView(APIView):

    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request):

        serializer = DiagnosisSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class DiagnosisRetrieveUpdateView(APIView):

    def get_permissions(self):

        if self.request.method == "GET":
            return [IsAuthenticated(), (IsDoctor() | IsAdmin())]

        return [IsAuthenticated(), IsRadiologist()]

    def get(self, request, pk):

        if not ObjectId.is_valid(pk):
            return Response(
                {"error": "Invalid image_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )


        img = RadiologyImage.objects(id=pk).first()

        if not img:
            return Response(
                {"error": "Image not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        diagnoses = Diagnosis.objects(image=img)

        serializer = DiagnosisSerializer(diagnoses, many=True)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def patch(self, request, pk):

        if not ObjectId.is_valid(pk):
            return Response(
                {"error": "Invalid diagnosis id format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        diagnosis = Diagnosis.objects(id=pk).first()

        if not diagnosis:
            return Response(
                {"error": "Diagnosis not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = DiagnosisSerializer(
            diagnosis,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
