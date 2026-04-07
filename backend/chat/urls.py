from django.urls import path
from . import views

urlpatterns = [
    path('users/<int:user_id>/messages/', views.ConversationHistoryView.as_view(), name='user_messages_history'),
    path('messages/', views.UserMessagesView.as_view(), name='user_messages'),
    path('users/<int:user_id>/read/', views.MarkConversationReadView.as_view(), name='mark_conversation_read'),
]