from django.contrib.auth.models import AbstractUser
from django.db import models
import mongoengine as me

class UserRole(models.TextChoices):
    ADMIN = 'admin'
    RADIOLOGIST = 'radiologist'
    DOCTOR = 'doctor'


class AdminProfile(me.Document):
    user_id = me.IntField(required=True, unique=True)

    meta = {
        'collection': 'admins',
        'indexes': [
            {'fields': ['user_id'], 'unique': True}
        ],
    }


class RadiologistProfile(me.Document):
    user_id = me.IntField(required=True, unique=True)

    meta = {
        'collection': 'radiologists',
        'indexes': [
            {'fields': ['user_id'], 'unique': True}
        ],
    }


class DoctorProfile(me.Document):
    user_id = me.IntField(required=True, unique=True)

    meta = {
        'collection': 'doctors',
        'indexes': [
            {'fields': ['user_id'], 'unique': True}
        ],
    }


class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.DOCTOR)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        previous_role = None
        if self.pk:
            try:
                previous_role = User.objects.get(pk=self.pk).role
            except User.DoesNotExist:
                previous_role = None

        super().save(*args, **kwargs)
        self._sync_mongo_role(previous_role)

    def _sync_mongo_role(self, previous_role=None):
        role_map = {
            UserRole.ADMIN: AdminProfile,
            UserRole.RADIOLOGIST: RadiologistProfile,
            UserRole.DOCTOR: DoctorProfile,
        }

        if previous_role and previous_role != self.role and previous_role in role_map:
            role_map[previous_role].objects(user_id=self.id).delete()

        current_profile = role_map.get(self.role)
        if current_profile:
            current_profile.objects(user_id=self.id).update_one(
                set__user_id=self.id,
                upsert=True,
            )
