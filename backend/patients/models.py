import mongoengine as me
import datetime
from django.contrib.auth import get_user_model

User = get_user_model()

class Patient(me.Document):
    patient_id = me.StringField(required=True, unique=True)
    first_name = me.StringField(required=True)
    last_name = me.StringField(required=True)
    date_of_birth = me.DateField()
    gender = me.StringField(choices=['M', 'F'])

    phone = me.StringField()
    email = me.StringField()

    # Management - links to medical records
    primary_doctor_id = me.IntField()
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'patients'}

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def primary_doctor(self):
        try:
            return User.objects.get(id=self.primary_doctor_id)
        except User.DoesNotExist:
            return None

    def save(self, *args, **kwargs):
        self.updated_at = datetime.datetime.utcnow()
        return super().save(*args, **kwargs)
