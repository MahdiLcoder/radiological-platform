from django.contrib.auth.models import AbstractUser
from django.db import models
import mongoengine as me

class UserRole(models.TextChoices):
    ADMIN = 'admin'
    RADIOLOGIST = 'radiologist'
    DOCTOR = 'doctor'

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices,default=UserRole.DOCTOR)
    phone = models.CharField(max_length=20, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        mongo_user = MongoUser.objects(django_id=self.id).first()

        if not mongo_user:
            MongoUser.objects.create(
                django_id=self.id,
                username=self.username,
                email=self.email,
                role=self.role,
                first_name=self.first_name,
                last_name=self.last_name
            )
        else:
            mongo_user.update(
                username=self.username,
                email=self.email,
                role=self.role,
                first_name=self.first_name,
                last_name=self.last_name
            )
class MongoUser(me.Document):
    django_id = me.IntField(required=True, unique=True)
    username = me.StringField(required=True)
    email = me.EmailField(required=True)
    role = me.StringField(required=True)
    first_name = me.StringField()
    last_name = me.StringField()

    meta = {'collection': 'users'}
