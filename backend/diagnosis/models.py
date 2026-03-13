import mongoengine as me
import datetime


class Diagnosis(me.Document):
    image         = me.ReferenceField('images.RadiologyImage', required=True)    
    ai_prediction = me.ReferenceField('inference.AiPredictions', required=False, null=True)  
    radiologist   = me.ReferenceField('accounts.MongoUser', required=True)   

    action         = me.StringField(choices=['accepted', 'modified', 'rejected'])
    final_finding  = me.StringField()
    clinical_notes = me.StringField()
    validated_at   = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'diagnoses'}