import datetime
import io
import requests
import numpy as np
from PIL import Image
from tensorflow.keras.applications.densenet import preprocess_input
from bson import ObjectId
import mongoengine as me
from rest_framework import serializers
from rest_framework.exceptions import NotFound, ValidationError
from .models import AiPredictions
from images.models import RadiologyImage
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



class AiPredictionsSerializer(serializers.Serializer):
    id          = serializers.CharField(read_only=True)
    image_id    = serializers.CharField(write_only=True)
    model_name  = serializers.CharField(read_only=True)
    predictions = serializers.DictField(read_only=True)
    analyzed_by = serializers.CharField(read_only=True)
    top_finding = serializers.CharField(read_only=True)
    confidence  = serializers.FloatField(read_only=True)
    analyzed_at = serializers.DateTimeField(read_only=True)

    def validate_image_id(self, value):
        if not ObjectId.is_valid(value):
            raise serializers.ValidationError("Invalid image ID format.")
        return value

    def create(self, validated_data):
        image_id_str = validated_data['image_id']
        image = RadiologyImage.objects(id=ObjectId(image_id_str)).first()
        
        if not image:
            raise serializers.ValidationError("Image not found.")
    
        modality = image.modality
        if modality not in MODEL_FILES:
            raise ValidationError(f"No model available for modality: {modality}")

        # Run Prediction
        model = get_model(modality)
        labels = CLASS_LABELS[modality]
        model_name = MODEL_FILES[modality].replace('.keras', '')

        img_array   = prepare_image(image.file_path)
        predictions_raw = model.predict(img_array, verbose=0)[0]

        top_index      = int(np.argmax(predictions_raw))
        top_label      = labels[top_index]
        top_confidence = float(predictions_raw[top_index])

        predictions_dict = {
            labels[i]: float(predictions_raw[i])
            for i in range(len(labels))
        }

        result = AiPredictions.objects(image=image).first()
        if result is None:
            result = AiPredictions(image=image)

        result.model_name  = model_name
        result.predictions = predictions_dict
        result.top_finding = top_label
        result.confidence  = top_confidence
        result.analyzed_at = datetime.datetime.utcnow()
        result.analyzed_by_id = self.context["request"].user.id

        result.save()

        image.status = "analyzed"
        image.save()

        return result

    def to_representation(self, instance):
        image_data = None
        try:
            if instance.image:
                patient_data = None
                try:
                    if instance.image.patient:
                        patient_data = {
                            "cin": instance.image.patient.cin,
                            "first_name": instance.image.patient.first_name,
                            "last_name": instance.image.patient.last_name,
                        }
                except me.DoesNotExist:
                    pass

                image_data = {
                    "id": str(instance.image.id),
                    "patient": patient_data,
                    "modality": instance.image.modality,
                    "status": instance.image.status,
                    "file_path": instance.image.file_path,
                }
        except me.DoesNotExist:
            pass

        return {
            "id": str(instance.id),
            "image": image_data,
            "model_name": instance.model_name,
            "predictions": instance.predictions,
            "top_finding": instance.top_finding,
            "confidence": instance.confidence,
            "analyzed_by": {
                "id": instance.analyzed_by.id,
                "email": instance.analyzed_by.email,
                "username": instance.analyzed_by.username,
            } if instance.analyzed_by else None,
            "analyzed_at": instance.analyzed_at.isoformat() if instance.analyzed_at else None,
        }
