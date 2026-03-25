from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import AdminProfile, RadiologistProfile, DoctorProfile, UserRole

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    medical_license_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    specialty = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    clinic = serializers.CharField(required=False, allow_blank=True, allow_null=True)


    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'role',
            'first_name', 'last_name', 'phone',
            'department',
            'medical_license_number', 'years_of_experience',
            'specialty', 'clinic',
        ]

    def create(self, validated_data):
        department = validated_data.pop('department', None)
        medical_license_number = validated_data.pop('medical_license_number', None)
        years_of_experience = validated_data.pop('years_of_experience', None)
        specialty = validated_data.pop('specialty', None)
        clinic = validated_data.pop('clinic', None)

        temp_password = validated_data.get('password')
        user = User.objects.create_user(**validated_data)

        # Send welcome email if created by an admin
        request = self.context.get('request')
        if request and request.user.is_authenticated and request.user.role == UserRole.ADMIN:
            from config.email_utils import send_welcome_email
            send_welcome_email(user, temp_password)

        if user.role == UserRole.ADMIN:
            AdminProfile.objects(user_id=user.id).update_one(
                set__department=department,
            )

        elif user.role == UserRole.RADIOLOGIST:
            RadiologistProfile.objects(user_id=user.id).update_one(
                set__medical_license_number=medical_license_number,
                set__years_of_experience=years_of_experience,
            )

        elif user.role == UserRole.DOCTOR:
            DoctorProfile.objects(user_id=user.id).update_one(
                set__specialty=specialty,
                set__medical_license_number=medical_license_number,
                set__clinic=clinic,
            )

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone']

    def to_representation(self, user):
        data = super().to_representation(user)

        if user.role == UserRole.ADMIN:
            profile = AdminProfile.objects(user_id=user.id).first()
            if profile:
                data['department'] = profile.department

        elif user.role == UserRole.RADIOLOGIST:
            profile = RadiologistProfile.objects(user_id=user.id).first()
            if profile:
                data['medical_license_number'] = profile.medical_license_number
                data['years_of_experience'] = profile.years_of_experience

        elif user.role == UserRole.DOCTOR:
            profile = DoctorProfile.objects(user_id=user.id).first()
            if profile:
                data['specialty'] = profile.specialty
                data['medical_license_number'] = profile.medical_license_number
                data['clinic'] = profile.clinic

        return data