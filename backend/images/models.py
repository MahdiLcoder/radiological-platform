import mongoengine as me
import datetime

MODALITY_CHOICES = ["X-Ray", "CT", "MRI"]

class RadiologyImage(me.Document):
    patient_name = me.StringField(required=True)
    patient_id = me.StringField(required=True)
    modality = me.StringField(required=True, choices=MODALITY_CHOICES)
    file_path = me.StringField(required=True)
    
    # Notice this is now a ReferenceField to 'MongoUser' instead of an IntField!
    uploaded_by = me.ReferenceField('MongoUser', required=True)
    
    uploaded_at = me.DateTimeField(default=datetime.datetime.now)
    status = me.StringField(default='pending', choices=['pending', 'analyzed', 'validated'])
    meta = {'collection': 'radiology_images', 'ordering': ['-uploaded_at']}