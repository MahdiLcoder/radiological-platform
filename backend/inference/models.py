import mongoengine as me
import datetime


class AiPredictions(me.Document):
    image       = me.ReferenceField('images.RadiologyImage', required=True)  
    analyzed_by = me.ReferenceField('accounts.MongoUser')                    
    model_name  = me.StringField(required=True)
    predictions = me.DictField(required=True)
    top_finding = me.StringField()
    confidence  = me.FloatField()
    analyzed_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'ai_predictions'}