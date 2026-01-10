"""
WebSocket routing for order updates.
"""
from django.urls import re_path
from . import consumers

# Note: In Channels, re_path patterns should match the full path
# The router will match these patterns against the WebSocket path
# Try with and without leading slash
websocket_urlpatterns = [
    re_path(r'^ws/orders/$', consumers.OrderConsumer.as_asgi()),
    re_path(r'^ws/orders/vendor/$', consumers.VendorOrderConsumer.as_asgi()),
    re_path(r'^ws/orders/customer/$', consumers.CustomerOrderConsumer.as_asgi()),
    # Also try without leading slash (some setups need this)
    re_path(r'ws/orders/$', consumers.OrderConsumer.as_asgi()),
    re_path(r'ws/orders/vendor/$', consumers.VendorOrderConsumer.as_asgi()),
    re_path(r'ws/orders/customer/$', consumers.CustomerOrderConsumer.as_asgi()),
]

