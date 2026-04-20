from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.permissions import IsRadiologist

from .models import Diagnosis
from .serializers import DiagnosisSerializer




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
