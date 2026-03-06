import os
import io
import logging

import requests
import numpy as np
from PIL import Image
from tensorflow import keras
from tensorflow.keras.applications.densenet import preprocess_input
from bson import ObjectId

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, APIException

from accounts.permissions import IsRadiologist, IsDoctor
from images.models import RadiologyImage
from .models import InferenceResult
from .serializers import InferenceResultSerializer

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'brain_tumor_densenet121.keras')
MODEL = keras.models.load_model(MODEL_PATH)

CLASS_LABELS = ["glioma", "meningioma", "notumor", "pituitary"]


def prepare_image(url):
    response = requests.get(url, timeout=15)
    img = Image.open(io.BytesIO(response.content)).convert("RGB")
    img = img.resize((224, 224))
    arr = preprocess_input(np.array(img, dtype=np.float32))
    arr = np.expand_dims(arr, axis=0)
    return arr


class RunInferenceView(APIView):
    permission_classes = [IsAuthenticated, IsRadiologist]

    def post(self, request, image_id):
        try:
            image = RadiologyImage.objects(id=ObjectId(image_id)).first()
            if not image:
                raise NotFound("Image not found.")

            if image.modality != "MRI":
                return Response(
                    {"detail": f"No model available for modality: {image.modality}"},
                    status=status.HTTP_422_UNPROCESSABLE_ENTITY,
                )

            img_array   = prepare_image(image.file_path)
            predictions = MODEL.predict(img_array, verbose=0)[0]

            top_index      = int(np.argmax(predictions))
            top_label      = CLASS_LABELS[top_index]
            top_confidence = float(predictions[top_index])

            predictions_dict = {
                CLASS_LABELS[i]: float(predictions[i])
                for i in range(len(CLASS_LABELS))
            }

            serializer = InferenceResultSerializer(data={
                "image_id":    str(image_id),
                "model_name":  "brain_tumor_densenet121",
                "predictions": predictions_dict,
                "top_finding": top_label,
                "confidence":  top_confidence,
            })
            serializer.is_valid(raise_exception=True)
            serializer.save()

            image.status = "analyzed"
            image.save()

            return Response(serializer.data, status=status.HTTP_200_OK)

        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in RunInferenceView: {e}", exc_info=True)
            raise APIException("Something went wrong.")


class InferenceResultView(APIView):
    permission_classes = [IsAuthenticated, IsDoctor]

    def get(self, request, image_id):
        try:
            result = InferenceResult.objects(image_id=ObjectId(image_id)).first()
            if not result:
                raise NotFound("No inference result found for this image.")

            return Response(InferenceResultSerializer(result).data, status=status.HTTP_200_OK)

        except NotFound:
            raise
        except Exception as e:
            logger.error(f"Error in InferenceResultView: {e}", exc_info=True)
            raise APIException("Something went wrong.")
