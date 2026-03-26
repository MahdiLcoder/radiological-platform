import datetime
from bson import ObjectId
import mongoengine as me
from rest_framework import serializers
from .models import AiPredictions
from images.models import RadiologyImage



class AiPredictionsSerializer(serializers.Serializer):
    id          = serializers.CharField(read_only=True)
    image_id   = serializers.CharField(write_only=True)
    model_name  = serializers.CharField()
    predictions = serializers.DictField()
    analyzed_by = serializers.CharField(read_only=True)
    top_finding = serializers.CharField(required=False, allow_null=True)
    confidence  = serializers.FloatField(required=False, allow_null=True)
    analyzed_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        image_id = ObjectId(validated_data['image_id'])

        image = RadiologyImage.objects(id=image_id).first()
        if not image:
            raise serializers.ValidationError({"image_id": "Image not found"})

        result = AiPredictions.objects(image=image).first()
        if result is None:
            result = AiPredictions(image=image)

        result.model_name  = validated_data['model_name']
        result.predictions = validated_data['predictions']
        result.top_finding = validated_data.get('top_finding')
        result.confidence  = validated_data.get('confidence')
        result.analyzed_at = datetime.datetime.utcnow()
        result.analyzed_by_id = self.context["request"].user.id

        result.save()
        return result

    def to_representation(self, instance):
        image_data = None
        try:
            if instance.image:
                patient_data = None
                try:
                    if instance.image.patient:
                        patient_data = {
                            "id": str(instance.image.patient.id),
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
