import mongoengine as me
import datetime


class Report(me.Document):

    image        = me.ReferenceField('images.RadiologyImage', required=True)
    diagnosis    = me.ReferenceField('diagnosis.Diagnosis', required=True)
    generated_by = me.IntField(required=True)
    pdf_data     = me.BinaryField()
    generated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'reports'}