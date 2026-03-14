import mongoengine as me
import datetime
from django.contrib.auth import get_user_model

MODALITY_CHOICES = ["X-Ray", "CT", "MRI"]

User = get_user_model()

class RadiologyImage(me.Document):
    patient      = me.ReferenceField('patients.Patient', required=True)
    modality     = me.StringField(required=True, choices=MODALITY_CHOICES)
    file_path    = me.StringField(required=True)
    uploaded_by_id  = me.IntField(required=True)
    uploaded_at  = me.DateTimeField(default=datetime.datetime.now)
    status       = me.StringField(default='pending', choices=['pending', 'analyzed', 'validated'])

    meta = {'collection': 'radiology_images', 'ordering': ['-uploaded_at']}

    @property
    def uploaded_by(self):
        try:
            return User.objects.get(id=self.uploaded_by_id)
        except User.DoesNotExist:
            return None
