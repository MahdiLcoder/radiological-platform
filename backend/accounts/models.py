from django.contrib.auth.models import AbstractUser
from django.db import models

class UserRole(models.TextChoices):
    ADMIN = 'admin', 'Admin'
    RADIOLOGIST = 'radiologist', 'Radiologist'
    DOCTOR = 'doctor', 'Doctor'

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices,
                            default=UserRole.DOCTOR)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
