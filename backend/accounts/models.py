from django.contrib.auth.models import AbstractUser
from django.db import models
import mongoengine as me


class UserRole(models.TextChoices):
    ADMIN = 'admin'
    RADIOLOGIST = 'radiologist'
    DOCTOR = 'doctor'


class AdminProfile(me.Document):
    user_id = me.IntField(required=True, unique=True)
    department = me.StringField()
    meta = {
        'collection': 'admins',
        'indexes': [{'fields': ['user_id'], 'unique': True}],
    }


class RadiologistProfile(me.Document):
    user_id = me.IntField(required=True, unique=True)
    medical_license_number = me.StringField()  
    years_of_experience = me.IntField()

    meta = {
        'collection': 'radiologists',
        'indexes': [{'fields': ['user_id'], 'unique': True}],
    }


class DoctorProfile(me.Document):
    user_id = me.IntField(required=True, unique=True)
    specialty = me.StringField()
    medical_license_number = me.StringField() 
    clinic = me.StringField() 

    meta = {
        'collection': 'doctors',
        'indexes': [{'fields': ['user_id'], 'unique': True}],
    }


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.DOCTOR)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    ROLE_MAP = {
        UserRole.ADMIN: AdminProfile,
        UserRole.RADIOLOGIST: RadiologistProfile,
        UserRole.DOCTOR: DoctorProfile,
    }

    def save(self, *args, **kwargs):
        previous_role = User.objects.filter(pk=self.pk).values_list('role', flat=True).first()
        super().save(*args, **kwargs)
        self._sync_mongo_role(previous_role)

    def _sync_mongo_role(self, previous_role=None):
        role_did_change = previous_role and previous_role != self.role
        if role_did_change and previous_role in self.ROLE_MAP:
            self.ROLE_MAP[previous_role].objects(user_id=self.id).delete()

        current_profile_class = self.ROLE_MAP.get(self.role)
        if current_profile_class:
            current_profile_class.objects(user_id=self.id).update_one(
                set__user_id=self.id,
                upsert=True,
            )

    def delete(self, *args, **kwargs):
        profile_class = self.ROLE_MAP.get(self.role)
        if profile_class:
            profile_class.objects(user_id=self.id).delete()
        super().delete(*args, **kwargs)