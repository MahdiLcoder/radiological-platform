from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CaseMessage
from .serializers import CaseMessageSerializer


class ConversationHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        current_user_id = request.user.id
        messages = CaseMessage.objects(
            __raw__={
                '$or': [
                    {'sender_id': current_user_id, 'receiver_id': user_id},
                    {'sender_id': user_id, 'receiver_id': current_user_id}
                ]
            }
        ).order_by('created_at')
        serializer = CaseMessageSerializer(messages, many=True)
        return Response(serializer.data)


class UserMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        messages = CaseMessage.objects(
            __raw__={'$or': [{'sender_id': user_id}, {'receiver_id': user_id}]}
        ).order_by('-created_at')
        
        # Group by conversation (the other user)
        conversations = {}
        for msg in messages:
            other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            key = f"{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
            if key not in conversations:
                conversations[key] = {
                    'other_user_id': other_user_id,
                    'last_message': msg
                }
        
        # Return conversations
        result = []
        for conv in conversations.values():
            # Get all messages for this conversation
            conv_messages = CaseMessage.objects(
                __raw__={
                    '$or': [
                        {'sender_id': user_id, 'receiver_id': conv['other_user_id']},
                        {'sender_id': conv['other_user_id'], 'receiver_id': user_id}
                    ]
                }
            ).order_by('created_at')
            serializer = CaseMessageSerializer(conv_messages, many=True)
            result.append({
                'other_user_id': conv['other_user_id'],
                'messages': serializer.data
            })
        
        return Response(result)