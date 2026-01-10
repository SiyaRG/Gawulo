"""
WebSocket middleware for logging connection attempts.
"""
from channels.middleware import BaseMiddleware


class WebSocketLoggingMiddleware(BaseMiddleware):
    """Middleware to log all WebSocket connection attempts."""
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            print("=" * 60)
            print("WebSocket middleware: Connection attempt detected")
            print(f"Path: {scope.get('path', 'unknown')}")
            print(f"Query string: {scope.get('query_string', b'').decode('utf-8')[:100]}")
            print("=" * 60)
        
        return await super().__call__(scope, receive, send)

