from rest_framework import serializers
from .models import Patient
from accounts.models import MongoUser


class PatientSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    patient_id = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    date_of_birth = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=['M', 'F', 'Other'], required=False)

    phone = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)

    primary_doctor = serializers.CharField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    updated_at = serializers.DateTimeField(read_only=True)

    def create(self, validated_data):
        request = self.context.get('request')
        if request and request.user:
            mongo_user = MongoUser.objects(django_id=request.user.id).first()
            if mongo_user:
                validated_data['primary_doctor'] = mongo_user

        patient = Patient(**validated_data)
        patient.save()
        return patient

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance