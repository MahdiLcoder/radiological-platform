import mongoengine as me
import datetime


class InferenceResult(me.Document):
    image_id = me.ObjectIdField(required=True)
    model_name = me.StringField(required=True)
    predictions = me.DictField(required=True)
    top_finding   = me.StringField()
    confidence    = me.FloatField() 
    analyzed_at   = me.DateTimeField(default=datetime.datetime.utcnow)
    meta = {'collection': 'inference_results'}