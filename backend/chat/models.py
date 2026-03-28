import datetime
import mongoengine as me


class CaseMessage(me.Document):
    sender_id = me.IntField(required=True)
    receiver_id = me.IntField(required=True)
    content = me.StringField(required=True)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    meta = {'collection': 'case_messages'}