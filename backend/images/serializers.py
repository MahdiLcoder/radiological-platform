import logging
import cloudinary.uploader
from rest_framework import serializers
from rest_framework.exceptions import APIException

from patients.models import Patient
from .models import RadiologyImage, MODALITY_CHOICES

logger = logging.getLogger(__name__)


class RadiologyImageSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient = serializers.CharField(write_only=True)  # Patient reference ObjectId
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
        patient_cin = validated_data.pop('patient')

        try:
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder=f"radiology_images/{patient_cin}",
                resource_type='image'
            )
            image_url = upload_result["secure_url"]

            # Find patient record
            patient = Patient.objects(cin=patient_cin).first()
            if not patient:
                raise serializers.ValidationError({"patient": "Patient not found"})

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
            "patient":{
                "cin": instance.patient.cin,
                "first_name": instance.patient.first_name,
                "last_name": instance.patient.last_name,
            }if instance.patient else None,
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
