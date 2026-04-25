from rest_framework import serializers
from .models import Patient


PHONE_REGEX = r'^\+?[\d\s\-\(\)]{7,20}$'


class PatientSerializer(serializers.Serializer):
    first_name = serializers.CharField(required=True, error_messages={'blank': 'First name is required.'})
    last_name = serializers.CharField(required=True, error_messages={'blank': 'Last name is required.'})
    date_of_birth = serializers.DateField(required=True)
    gender = serializers.ChoiceField(choices=['M', 'F', 'Other'], required=True)

    phone = serializers.RegexField(
        regex=PHONE_REGEX,
        required=True,
        allow_blank=False,
        error_messages={
            'blank': 'Phone number is required.',
            'invalid': 'Enter a valid phone number (digits, spaces, dashes, parentheses allowed).',
        },
    )
    cin = serializers.RegexField(
        regex=r'^\d{8}$',
        required=True,
        error_messages={
            'blank': 'CIN is required.',
            'invalid': 'CIN must be exactly 8 digits.'
        }
    )
    email = serializers.EmailField(required=False, allow_blank=True, error_messages={'invalid': 'Enter a valid email address.'})

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
