import os
import io
import logging

import requests
import numpy as np
from PIL import Image
from tensorflow.keras.applications.densenet import preprocess_input
from bson import ObjectId

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, APIException

from accounts.permissions import IsRadiologist, IsDoctor, IsAdmin
from images.models import RadiologyImage
from .models import AiPredictions
from .serializers import AiPredictionsSerializer

logger = logging.getLogger(__name__)

from .model_loader import get_model, MODEL_FILES

CLASS_LABELS = {
    "MRI": ["glioma", "meningioma", "notumor", "pituitary"],
    "X-Ray": ["COVID", "Lung_Opacity", "Normal", "Viral Pneumonia"],
    "CT": ["Bengin cases", "Malignant cases", "Normal cases"]
}


def prepare_image(url):
    response = requests.get(url, timeout=15)
    img = Image.open(io.BytesIO(response.content)).convert("RGB")
    img = img.resize((224, 224))
    arr = preprocess_input(np.array(img, dtype=np.float32))
    arr = np.expand_dims(arr, axis=0)
    return arr


class RunAiPredictionView(APIView):
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request, image_id):
        try:
            image = RadiologyImage.objects(id=ObjectId(image_id)).first()
            if not image:
                raise NotFound("Image not found.")

            modality = image.modality
            if modality not in MODEL_FILES:
                return Response(
                    {"detail": f"No model available for modality: {modality}"},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            model = get_model(modality)
            labels = CLASS_LABELS[modality]
            model_name = MODEL_FILES[modality].replace('.keras', '')

            img_array   = prepare_image(image.file_path)
            predictions = model.predict(img_array, verbose=0)[0]

            top_index      = int(np.argmax(predictions))
            top_label      = labels[top_index]
            top_confidence = float(predictions[top_index])

            predictions_dict = {
                labels[i]: float(predictions[i])
                for i in range(len(labels))
            }

            serializer = AiPredictionsSerializer(data={
                "image_id":    str(image_id),
                "model_name":  model_name,
                "predictions": predictions_dict,
                "top_finding": top_label,
                "confidence":  top_confidence,
            }, context={"request": request})
            serializer.is_valid(raise_exception=True)
            
            pred = serializer.save()

            image.status = "analyzed"
            image.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in RunAiPredictionView: {e}", exc_info=True)
            raise APIException("Something went wrong.")


class AiPredictionsView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsAdmin | IsRadiologist)]

    def get(self, request, image_id):
        try:
            result = AiPredictions.objects(image=ObjectId(image_id)).first()
            if not result:
                raise NotFound("No inference result found for this image.")

            return Response(AiPredictionsSerializer(result).data, status=status.HTTP_200_OK)

        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in AiPredictionsView: {e}", exc_info=True)
            raise APIException("Something went wrong.")
class AllFindingsListView(APIView):
    permission_classes = [IsAuthenticated, (IsDoctor | IsAdmin | IsRadiologist)]

    def get(self, request):
        # Filtering parameters
        modality = request.query_params.get('modality')
        confidence_min = request.query_params.get('confidence_min')
        status_filter = request.query_params.get('status')
        
        query = {}
        if confidence_min:
            try:
                query['confidence__gte'] = float(confidence_min)
            except ValueError:
                pass
            
        # Modality and Status filters (join-like logic for MongoEngine)
        image_filters = {}
        if modality and modality != 'All':
            image_filters['modality'] = modality
        if status_filter and status_filter != 'All':
            # Map frontend labels to backend status if needed
            status_map = {'Validated': 'validated', 'Pending Review': 'analyzed', 'Rejected': 'pending'}
            backend_status = status_map.get(status_filter)
            if backend_status:
                image_filters['status'] = backend_status
            
        if image_filters:
            image_ids = RadiologyImage.objects(**image_filters).scalar('id')
            query['image__in'] = image_ids
            
        findings = AiPredictions.objects(**query).order_by('-analyzed_at')
        
        # Pagination logic
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 10))
        except ValueError:
            page = 1
            page_size = 10
            
        total = findings.count()
        start = (page - 1) * page_size
        end = start + page_size
        
        results = findings[start:end]
        serializer = AiPredictionsSerializer(results, many=True)
        
        return Response({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": serializer.data
        }, status=status.HTTP_200_OK)
