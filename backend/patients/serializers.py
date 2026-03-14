from rest_framework import serializers
from .models import Patient


class PatientSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    date_of_birth = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=['M', 'F', 'Other'], required=False)

    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    doctor = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            validated_data['doctor_id'] = request.user.id

        patient = Patient(**validated_data)
        patient.save()
        return patient

    def get_doctor(self, obj):
        user = obj.doctor
        if not user:
            return None
        return {
            "id": user.id,
            "email": user.email,
            "username": user.username,
        }

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
