import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken

from .models import Conversation, Message

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = None
        self.authenticated = False
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"chat_{self.conversation_id}"
        await self.accept()

    async def disconnect(self, close_code):
        if self.authenticated:
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name,
            )

    async def receive(self, text_data):
        try:
            payload = json.loads(text_data)
        except json.JSONDecodeError:
            await self.close(code=4001)
            return

        if not self.authenticated:
            await self.authenticate(payload)
            return

        message_content = payload.get("message")
        if not message_content:
            return

        message = await self.save_message(
            self.conversation_id,
            self.user,
            message_content,
        )

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "id": message.id,
                "message": message.content,
                "sender_id": self.user.id,
                "sender_name": self.user.username,
                "timestamp": message.timestamp.strftime("%Y-%m-%d %H:%M"),
            },
        )

    async def authenticate(self, payload):
        if payload.get("type") != "authenticate":
            await self.close(code=4001)
            return

        user = await self.get_user_from_token(payload.get("token"))
        if not user:
            await self.close(code=4001)
            return

        has_access = await self.verify_user_access(self.conversation_id, user)
        if not has_access:
            await self.close(code=4003)
            return

        self.user = user
        self.authenticated = True
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.mark_messages_read(self.conversation_id, user)
        await self.send(text_data=json.dumps({"type": "authenticated"}))

    async def chat_message(self, event):
        if self.authenticated:
            await self.send(text_data=json.dumps(event))

    @database_sync_to_async
    def get_user_from_token(self, token):
        if not token:
            return None
        try:
            access_token = AccessToken(token)
            user_id = access_token["user_id"]
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
        return Message.objects.create(
            conversation=conv,
            sender=user,
            content=content,
        )

    @database_sync_to_async
    def mark_messages_read(self, conversation_id, user):
        Message.objects.filter(
            conversation_id=conversation_id,
        ).exclude(sender=user).update(is_read=True)
