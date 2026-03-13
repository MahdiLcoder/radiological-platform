import datetime
from bson import ObjectId
from rest_framework import serializers
from rest_framework.exceptions import APIException
from .models import AiPredictions
from accounts.models import MongoUser



class AiPredictionsSerializer(serializers.Serializer):
    id          = serializers.CharField(read_only=True)
    image   = serializers.CharField()
    model_name  = serializers.CharField()
    predictions = serializers.DictField()
    analyzed_by = serializers.CharField(read_only=True)
    top_finding = serializers.CharField(required=False, allow_null=True)
    confidence  = serializers.FloatField(required=False, allow_null=True)
    analyzed_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        image_id = ObjectId(validated_data['image_id'])

        mongo_user = MongoUser.objects(django_id=self.context["request"].user.id).first()

        result = AiPredictions.objects(image_id=image_id).first()
        if result is None:
            result = AiPredictions(image_id=image_id)

        result.model_name  = validated_data['model_name']
        result.predictions = validated_data['predictions']
        result.top_finding = validated_data.get('top_finding')
        result.confidence  = validated_data.get('confidence')
        result.analyzed_at = datetime.datetime.utcnow()
        result.analyzed_by = mongo_user

        result.save()
        return result

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "image": {
                "id": str(instance.image.id),
                "patient_name": instance.image.patient_name,
                "patient_id": instance.image.patient_id,
                "modality": instance.image.modality,
            } if instance.image else None,
            "model_name": instance.model_name,
            "predictions": instance.predictions,
            "top_finding": instance.top_finding,
            "confidence": instance.confidence,
            "analyzed_by": {
                "id": str(instance.analyzed_by.id),
                "email": instance.analyzed_by.email,
                "username": instance.analyzed_by.username,
            } if instance.analyzed_by else None,
            "analyzed_at": instance.analyzed_at.isoformat() if instance.analyzed_at else None,
        }