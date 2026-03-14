import mongoengine as me
import datetime
from django.contrib.auth import get_user_model

User = get_user_model()

class AiPredictions(me.Document):
    image       = me.ReferenceField('images.RadiologyImage', required=True)  
    analyzed_by_id = me.IntField()                    
    model_name  = me.StringField(required=True)
    predictions = me.DictField(required=True)
    top_finding = me.StringField()
    confidence  = me.FloatField()
    analyzed_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'ai_predictions'}

    @property
    def analyzed_by(self):
        try:
            return User.objects.get(id=self.analyzed_by_id)
        except User.DoesNotExist:
            return None
