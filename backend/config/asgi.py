"""ASGI config for Car Parts Marketplace."""
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

# We import routing here to ensure django is loaded first
django_asgi_app = get_asgi_application()
import api.routing

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": URLRouter(
        api.routing.websocket_urlpatterns
    ),
})

