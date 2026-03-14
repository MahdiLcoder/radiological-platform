import mongoengine as me
import datetime
from django.contrib.auth import get_user_model

User = get_user_model()

class Diagnosis(me.Document):
    image         = me.ReferenceField('images.RadiologyImage', required=True)    
    ai_prediction = me.ReferenceField('inference.AiPredictions', required=False, null=True)  
    radiologist_id   = me.IntField(required=True)

    action         = me.StringField(choices=['accepted', 'modified', 'rejected'])
    final_finding  = me.StringField()
    clinical_notes = me.StringField()
    validated_at   = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'diagnoses'}

    @property
    def radiologist(self):
        try:
            return User.objects.get(id=self.radiologist_id)
        except User.DoesNotExist:
            return None
