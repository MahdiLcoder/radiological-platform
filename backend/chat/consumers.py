import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import CaseMessage
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.sender_id = self.scope['url_route']['kwargs']['sender_id']
        self.receiver_id = self.scope['url_route']['kwargs']['receiver_id']
        # Create a room name based on the two user IDs, sorted to ensure consistency
        self.room_group_name = f'chat_{min(self.sender_id, self.receiver_id)}_{max(self.sender_id, self.receiver_id)}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        content = text_data_json.get('message', '') or text_data_json.get('content', '')
        sender_id = text_data_json['sender_id']
        receiver_id = text_data_json['receiver_id']

        # Save message to database and retrieve creation timestamp
        created_at = await self.save_message(sender_id, receiver_id, content)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'content': content,
                'sender_id': sender_id,
                'receiver_id': receiver_id,
                'created_at': created_at,
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket with properties matching the API serializer
        await self.send(text_data=json.dumps({
            'content': event['content'],
            'sender_id': event['sender_id'],
            'receiver_id': event['receiver_id'],
            'created_at': event['created_at'],
        }))

    @sync_to_async
    def save_message(self, sender_id, receiver_id, content):
        msg = CaseMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content
        )
        msg.save()
        return msg.created_at.strftime('%Y-%m-%dT%H:%M:%S.%fZ')