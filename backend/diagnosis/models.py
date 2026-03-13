from backend.images.models import RadiologyImage
from backend.inference.models import AiPredictions
from accounts.models import MongoUser
import mongoengine as me
import datetime


class Diagnosis(me.Document):
    image          = me.ReferenceField(RadiologyImage, required=True)
    ai_prediction  = me.ReferenceField(AiPredictions, required=False, null=True)
    radiologist    = me.ReferenceField(MongoUser, required=True)

    action         = me.StringField(choices=['accepted', 'modified', 'rejected'])
    final_finding  = me.StringField()
    clinical_notes = me.StringField()
    validated_at   = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'diagnosis'}