from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.permissions import IsRadiologist, IsDoctor

from bson import ObjectId

from .models import Diagnosis
from .serializers import DiagnosisSerializer


class DiagnosisCreateView(APIView):

    permission_classes = [IsRadiologist]

    def post(self, request):

        serializer = DiagnosisSerializer(data=request.data)

        if serializer.is_valid():

            from accounts.models import MongoUser

            mongo_user = MongoUser.objects(
                django_id=request.user.id
            ).first()

            if not mongo_user:
                return Response(
                    {"error": "MongoUser sync error"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            serializer.save(radiologist_id=mongo_user)

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
            return [IsDoctor()]

        return [IsRadiologist()]

    def get(self, request, pk):

        if not ObjectId.is_valid(pk):
            return Response(
                {"error": "Invalid image_id format"},
                status=status.HTTP_400_BAD_REQUEST
            )

        from images.models import RadiologyImage

        img = RadiologyImage.objects(id=pk).first()

        if not img:
            return Response(
                {"error": "Image not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        diagnoses = Diagnosis.objects(image_id=img)

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
            partial=True
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