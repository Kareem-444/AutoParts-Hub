import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
import jwt
from django.conf import settings
from .models import Conversation, Message

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        self.user = await self.get_user_from_token(token)
        
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Verify user belongs to conversation
        has_access = await self.verify_user_access(self.conversation_id, self.user)
        if not has_access:
            await self.close(code=4003)
            return

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        
        # Mark all messages as read
        await self.mark_messages_read(self.conversation_id, self.user)

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Leave room group
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json.get('message')

        if not message_content:
            return

        # Save message to database
        message = await self.save_message(self.conversation_id, self.user, message_content)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'message': message.content,
                'sender_id': self.user.id,
                'sender_name': self.user.username,
                'timestamp': message.timestamp.strftime('%Y-%m-%d %H:%M'),
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token:
            return None
        try:
            # We can use simplejwt AccessToken or jwt directly
            decoded_data = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            return User.objects.get(id=user_id)
        except Exception:
            return None

    @database_sync_to_async
    def verify_user_access(self, conversation_id, user):
        try:
            conv = Conversation.objects.get(id=conversation_id)
            return user == conv.buyer or user == conv.seller
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, conversation_id, user, content):
        conv = Conversation.objects.get(id=conversation_id)
        message = Message.objects.create(
            conversation=conv,
            sender=user,
            content=content,
        )
        return message
        
    @database_sync_to_async
    def mark_messages_read(self, conversation_id, user):
        Message.objects.filter(
            conversation_id=conversation_id
        ).exclude(sender=user).update(is_read=True)
