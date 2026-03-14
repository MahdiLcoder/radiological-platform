from rest_framework import serializers
from rest_framework.exceptions import APIException
from .models import RadiologyImage, MODALITY_CHOICES
import cloudinary.uploader
import logging

logger = logging.getLogger(__name__)


class RadiologyImageSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient_id = serializers.CharField(write_only=True)
    patient = serializers.CharField(read_only=True)  # Patient reference ID
    modality = serializers.ChoiceField(choices=MODALITY_CHOICES)
    file_path = serializers.CharField(read_only=True)
    uploaded_by = serializers.CharField(read_only=True)
    uploaded_at = serializers.DateTimeField(read_only=True)
    status = serializers.ChoiceField(choices=['pending', 'analyzed', 'validated'], read_only=True)

    image = serializers.ImageField(write_only=True, required=True)

    def validate_image(self, image):

        if not image.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError('Invalid file extension, allowed: jpg, jpeg, png')
        return image

    def create(self, validated_data):
        image_file = validated_data.pop('image')
        patient_id = validated_data['patient_id']

        try:
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder=f"radiology_images/{patient_id}",
                resource_type='image'
            )
            image_url = upload_result["secure_url"]

            from patients.models import Patient

            # Find patient record
            patient = Patient.objects(patient_id=patient_id).first()
            if not patient:
                raise serializers.ValidationError({"patient_id": "Patient not found"})

            image_doc = RadiologyImage(
                modality=validated_data['modality'],
                file_path=image_url,
                uploaded_by_id=self.context["request"].user.id,
                patient=patient
            )
            image_doc.save()
            return image_doc
        except Exception as e:
            logger.error(f"Error in RadiologyImageSerializer.create: {e}", exc_info=True)
            raise APIException("Something went wrong")

    def to_representation(self, instance):
        return {
            "id": str(instance.id),
            "patient": str(instance.patient.id) if instance.patient else None,
            "patient_name": instance.patient.full_name if instance.patient else None,
            "patient_id": instance.patient.patient_id if instance.patient else None,
            "modality": instance.modality,
            "file_path": instance.file_path,
            "uploaded_by": {
                "id": instance.uploaded_by.id,
                "email": instance.uploaded_by.email,
                "username": instance.uploaded_by.username,
            } if instance.uploaded_by else None,
            "uploaded_by_id": instance.uploaded_by_id,
            "uploaded_at": instance.uploaded_at.isoformat() if instance.uploaded_at else None,
            "status": instance.status
        }
