from django.contrib.auth import get_user_model
from rest_framework import serializers

from config.email_utils import send_welcome_email
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
    old_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8)

    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    medical_license_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    years_of_experience = serializers.IntegerField(required=False, allow_null=True)
    specialty = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    clinic = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'role', 'first_name', 'last_name', 'phone', 'created_at',
            'old_password', 'new_password',
            'department', 'medical_license_number', 'years_of_experience', 'specialty', 'clinic',
        ]

    def validate(self, attrs):
        old_password = attrs.pop('old_password', None)
        new_password = attrs.pop('new_password', None)

        if old_password or new_password:
            if not old_password:
                raise serializers.ValidationError({'old_password': 'Old password is required to set a new password.'})
            if not new_password:
                raise serializers.ValidationError({'new_password': 'New password is required.'})
            if not self.instance.check_password(old_password):
                raise serializers.ValidationError({'old_password': 'Incorrect old password.'})

        attrs['_new_password'] = new_password
        return attrs

    def update(self, instance, validated_data):
        new_password = validated_data.pop('_new_password', None)

        profile_fields = ['department', 'medical_license_number', 'years_of_experience', 'specialty', 'clinic']
        profile_data = {k: validated_data.pop(k) for k in profile_fields if k in validated_data}

        old_values = {f: getattr(instance, f) for f in validated_data}
        previous_role = User.objects.filter(pk=instance.pk).values_list('role', flat=True).first()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if new_password:
            instance.set_password(new_password)

        changed = ['password'] if new_password else []
        changed.extend(f for f, v in old_values.items() if getattr(instance, f) != v)

        if changed:
            instance.save(update_fields=changed)
        else:
            instance.save(update_fields=['password'])

        instance._sync_mongo_role(previous_role)

        if profile_data:
            self._update_mongo_profile(instance, profile_data)

        return instance

    def _update_mongo_profile(self, instance, profile_data):
        if instance.role == UserRole.ADMIN:
            allowed = ['department']
            update = {f'set__{k}': v for k, v in profile_data.items() if k in allowed}
            if update:
                AdminProfile.objects(user_id=instance.id).update_one(**update)
        elif instance.role == UserRole.RADIOLOGIST:
            allowed = ['medical_license_number', 'years_of_experience']
            update = {f'set__{k}': v for k, v in profile_data.items() if k in allowed}
            if update:
                RadiologistProfile.objects(user_id=instance.id).update_one(**update)
        elif instance.role == UserRole.DOCTOR:
            allowed = ['specialty', 'medical_license_number', 'clinic']
            update = {f'set__{k}': v for k, v in profile_data.items() if k in allowed}
            if update:
                DoctorProfile.objects(user_id=instance.id).update_one(**update)

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
