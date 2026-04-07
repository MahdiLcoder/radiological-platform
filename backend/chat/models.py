import datetime
import mongoengine as me


class ChatMessage(me.Document):
    sender_id = me.IntField(required=True)
    receiver_id = me.IntField(required=True)
    content = me.StringField(required=True)
    is_read = me.BooleanField(default=False)
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    meta = {
        'collection': 'chat_messages',
        'indexes': [
            ('sender_id', 'receiver_id'),  
            '-created_at',                  
        ]
    }