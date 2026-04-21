from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ChatMessage
from .serializers import ChatMessageSerializer


class ConversationHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        current_user_id = request.user.id
        messages = ChatMessage.objects(
            __raw__={
                '$or': [
                    {'sender_id': current_user_id, 'receiver_id': user_id},
                    {'sender_id': user_id, 'receiver_id': current_user_id}
                ]
            }
        ).order_by('created_at')
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)


class UserMessagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id

        # Fetch all messages for this user in one query — no N+1
        messages = ChatMessage.objects(
            __raw__={'$or': [{'sender_id': user_id}, {'receiver_id': user_id}]}
        ).order_by('-created_at')

        # Group messages by conversation key, reusing the already-fetched queryset
        conversations = {}
        for msg in messages:
            other_user_id = msg.receiver_id if msg.sender_id == user_id else msg.sender_id
            key = f"{min(user_id, other_user_id)}_{max(user_id, other_user_id)}"
            if key not in conversations:
                conversations[key] = {
                    'other_user_id': other_user_id,
                    'messages': []
                }
            conversations[key]['messages'].append(msg)

        result = []
        for conv in conversations.values():
            # Messages came in descending order; reverse per conversation for chronological display
            conv['messages'].sort(key=lambda m: m.created_at)
            serializer = ChatMessageSerializer(conv['messages'], many=True)
            result.append({
                'other_user_id': conv['other_user_id'],
                'messages': serializer.data
            })

        return Response(result)


class MarkConversationReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, user_id):
        current_user_id = request.user.id
        updated_count = ChatMessage.objects(
            sender_id=user_id,
            receiver_id=current_user_id,
            is_read=False
        ).update(set__is_read=True)
        return Response({'updated': updated_count})