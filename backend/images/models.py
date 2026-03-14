import mongoengine as me
import datetime

MODALITY_CHOICES = ["X-Ray", "CT", "MRI"]


class RadiologyImage(me.Document):
    patient      = me.ReferenceField('patients.Patient', required=True)
    modality     = me.StringField(required=True, choices=MODALITY_CHOICES)
    file_path    = me.StringField(required=True)
    uploaded_by  = me.ReferenceField('accounts.MongoUser', required=True)
    uploaded_at  = me.DateTimeField(default=datetime.datetime.now)
    status       = me.StringField(default='pending', choices=['pending', 'analyzed', 'validated'])

    meta = {'collection': 'radiology_images', 'ordering': ['-uploaded_at']}
