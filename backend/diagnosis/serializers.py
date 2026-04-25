from rest_framework import serializers
from rest_framework.exceptions import APIException
from .models import Diagnosis
from images.models import RadiologyImage
from inference.models import AiPredictions


class DiagnosisSerializer(serializers.Serializer):

    id             = serializers.CharField(read_only=True)
    image          = serializers.CharField(required=True)
    ai_prediction  = serializers.CharField(required=False, allow_null=True)
    radiologist_id    = serializers.IntegerField(read_only=True)

    action         = serializers.ChoiceField(choices=['accepted', 'modified', 'rejected'])
    final_finding  = serializers.CharField(required=False, allow_blank=True)
    clinical_notes = serializers.CharField(required=False, allow_blank=True)
    validated_at   = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        

        img_id = validated_data.pop('image')
        img = RadiologyImage.objects(id=img_id).first()
        if not img:
            raise serializers.ValidationError({"image": "Image not found"})

        ai_pred = None
        ai_pred_id = validated_data.pop('ai_prediction', None)
        if ai_pred_id:
            ai_pred = AiPredictions.objects(id=ai_pred_id).first()
            if not ai_pred:
                raise serializers.ValidationError({"ai_prediction": "AI Prediction not found"})

        diagnosis = Diagnosis(
            image=img,
            ai_prediction=ai_pred,
            radiologist_id=self.context["request"].user.id,
            action=validated_data.get("action"),
            final_finding=validated_data.get("final_finding", ""),
            clinical_notes=validated_data.get("clinical_notes", "")
        )
        diagnosis.save()

        try:
            img.status = "validated"
            img.save()
        except Exception:
            pass

        return diagnosis

    def update(self, instance, validated_data):
        instance.action         = validated_data.get("action", instance.action)
        instance.final_finding  = validated_data.get("final_finding", instance.final_finding)
        instance.clinical_notes = validated_data.get("clinical_notes", instance.clinical_notes)
        instance.save()
        return instance

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "image": {
                "id": str(instance.image.id),
                "patient_name": instance.image.patient.full_name if instance.image and instance.image.patient else None,
                "patient": instance.image.patient.cin if instance.image and instance.image.patient else None,
                "modality": instance.image.modality,
            } if instance.image else None,
            "ai_prediction": {
                "id": str(instance.ai_prediction.id),
                "model_name": instance.ai_prediction.model_name,
                "top_finding": instance.ai_prediction.top_finding,
                "confidence": instance.ai_prediction.confidence,
            } if instance.ai_prediction else None,
            "radiologist": {
                "id": instance.radiologist.id,
                "email": instance.radiologist.email,
                "username": instance.radiologist.username,
            } if instance.radiologist else None,
            "radiologist_id": instance.radiologist_id,
            "action": instance.action,
            "final_finding": instance.final_finding,
            "clinical_notes": instance.clinical_notes,
            "validated_at": instance.validated_at.isoformat() if instance.validated_at else None,
        }
