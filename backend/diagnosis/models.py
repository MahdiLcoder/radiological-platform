import mongoengine as me
import datetime


class Diagnosis(me.Document):
    image         = me.ReferenceField('images.RadiologyImage', required=True)       # ✅ string reference
    ai_prediction = me.ReferenceField('inference.AiPredictions', required=False, null=True)  # ✅ string reference
    radiologist   = me.ReferenceField('accounts.MongoUser', required=True)          # ✅ string reference

    action         = me.StringField(choices=['accepted', 'modified', 'rejected'])
    final_finding  = me.StringField()
    clinical_notes = me.StringField()
    validated_at   = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'diagnoses'}