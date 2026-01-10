"""
ASGI config for ReachHub project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Gawulo.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

# Import routing after Django is initialized
from orders.routing import websocket_urlpatterns

print("=" * 60)
print("ASGI Application Initialized")
print(f"DEBUG mode: {settings.DEBUG}")
print(f"WebSocket URL patterns: {len(websocket_urlpatterns)} patterns")
for pattern in websocket_urlpatterns:
    print(f"  - {pattern.pattern}")
print("=" * 60)

# WebSocket application wrapper for logging
class WebSocketLogger:
    """ASGI middleware to log all WebSocket connection attempts."""
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            print("=" * 60)
            print("ASGI LEVEL: WebSocket connection detected")
            print(f"Path: {scope.get('path', 'unknown')}")
            print(f"Query string: {scope.get('query_string', b'').decode('utf-8')[:100]}")
            print(f"Client: {scope.get('client', 'unknown')}")
            try:
                headers = {k.decode(): v.decode() for k, v in scope.get('headers', [])}
                print(f"Headers: {headers}")
            except:
                print(f"Headers: {scope.get('headers', [])}")
            print("=" * 60)
        return await self.app(scope, receive, send)

# Wrapper to log all ASGI requests
class ASGIRequestLogger:
    """Log all ASGI requests before routing."""
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        protocol_type = scope.get("type", "unknown")
        if protocol_type == "websocket":
            print("=" * 60)
            print("ASGI REQUEST LOGGER: WebSocket request received")
            print(f"  Path: {scope.get('path', 'unknown')}")
            print(f"  Query: {scope.get('query_string', b'').decode('utf-8')[:50]}")
            print("=" * 60)
        return await self.app(scope, receive, send)

# For development, allow all origins for WebSocket
# In production, use AllowedHostsOriginValidator
if settings.DEBUG:
    ws_app = WebSocketLogger(URLRouter(websocket_urlpatterns))
    router = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": ws_app,
    })
    application = ASGIRequestLogger(router)
else:
    ws_app = WebSocketLogger(AllowedHostsOriginValidator(
        URLRouter(websocket_urlpatterns)
    ))
    router = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": ws_app,
    })
    application = ASGIRequestLogger(router)
