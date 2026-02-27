from rest_framework import serializers
from .models import RadiologyImage, MODALITY_CHOICES
import cloudinary.uploader


class RadiologyImageSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient_name = serializers.CharField()
    patient_id = serializers.CharField()
    modality = serializers.ChoiceField(choices=MODALITY_CHOICES)
    file_path = serializers.CharField(read_only=True)
    uploaded_by = serializers.IntegerField(read_only=True)
    uploaded_at = serializers.DateTimeField(read_only=True)
    status = serializers.ChoiceField(choices=['pending', 'analyzed', 'validated'], read_only=True)

    image = serializers.ImageField(write_only=True, required=True)

    def validate_image(self, image):
        if not image.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            raise serializers.ValidationError('Image must be a valid image file (jpg, jpeg, png)')
        return image

    def create(self, validated_data):
        image_file = validated_data.pop('image')
        patient_id = validated_data['patient_id']

        upload_result = cloudinary.uploader.upload(
            image_file,
            folder=f"radiology_images/{patient_id}",
            resource_type='image'
        )
        image_url = upload_result["secure_url"]
        image_doc = RadiologyImage(
            **validated_data,
            file_path=image_url,
            uploaded_by=self.context["request"].user.id
        )
        image_doc.save()
        return image_doc