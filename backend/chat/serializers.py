from rest_framework import serializers
from .models import CaseMessage


class CaseMessageSerializer(serializers.Serializer):
    sender_id = serializers.IntegerField()
    receiver_id = serializers.IntegerField()
    content = serializers.CharField()
    created_at = serializers.DateTimeField()