import mongoengine as me
import datetime
from django.contrib.auth import get_user_model

User = get_user_model()

class Patient(me.Document):
    first_name = me.StringField(required=True)
    last_name = me.StringField(required=True)
    date_of_birth = me.DateField(required=True)
    gender = me.StringField(choices=['M', 'F', 'Other'], required=True)

    phone = me.StringField(required=True)
    email = me.StringField()

    doctor_id = me.IntField()
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'patients'}

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def doctor(self):
        try:
            return User.objects.get(id=self.doctor_id)
        except User.DoesNotExist:
            return None
