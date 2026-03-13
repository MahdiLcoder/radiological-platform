import mongoengine as me
import datetime
from images.models import RadiologyImage
from diagnosis.models import Diagnosis

class Report(me.Document):
    image = me.ReferenceField(RadiologyImage, required=True)
    diagnosis = me.ReferenceField(Diagnosis, required=True)
    generated_by = me.IntField(required=True)
    pdf_path = me.StringField()
    generated_at = me.DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {'collection': 'reports'}
