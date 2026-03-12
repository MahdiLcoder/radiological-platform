import datetime
from bson import ObjectId
from rest_framework import serializers
from rest_framework.exceptions import APIException
from .models import InferenceResult


class InferenceResultSerializer(serializers.Serializer):
    id          = serializers.CharField(read_only=True)
    image_id    = serializers.CharField()
    model_name  = serializers.CharField()
    predictions = serializers.DictField()
    analyzed_by = serializers.DictField(read_only=True)

    def create(self, validated_data):
        image_id = ObjectId(validated_data['image_id'])

        result = InferenceResult.objects(image_id=image_id).first()
        if result is None:
            result = InferenceResult(image_id=image_id)

        result.model_name  = validated_data['model_name']
        result.predictions = validated_data['predictions']
        result.top_finding = validated_data['top_finding']
        result.confidence  = validated_data['confidence']
        result.analyzed_at = datetime.datetime.utcnow()
        
        if 'analyzed_by' in validated_data:
             result.analyzed_by = validated_data['analyzed_by']

        result.save()
        return result