import mongoengine as me
import datetime


class Patient(me.Document):
    patient_id = me.StringField(required=True, unique=True)
    first_name = me.StringField(required=True)
    last_name = me.StringField(required=True)
    date_of_birth = me.DateField()
    gender = me.StringField(choices=['M', 'F'])

    phone = me.StringField()
    email = me.StringField()

    # Management - links to medical records
    primary_doctor = me.ReferenceField('accounts.MongoUser')
    created_at = me.DateTimeField(default=datetime.datetime.utcnow)
    updated_at = me.DateTimeField(default=datetime.datetime.utcnow)

    meta = {'collection': 'patients'}

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        self.updated_at = datetime.datetime.utcnow()
        return super().save(*args, **kwargs)