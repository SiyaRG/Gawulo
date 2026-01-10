"""
Quick script to verify WebSocket setup is correct.
Run this to check if everything is configured properly.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Gawulo.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.conf import settings

print("=" * 60)
print("WebSocket Configuration Check")
print("=" * 60)

# Check if channels is installed
try:
    import channels
    print(f"✓ Channels installed: {channels.__version__}")
except ImportError:
    print("✗ Channels NOT installed!")
    sys.exit(1)

# Check if daphne is installed
try:
    import daphne
    print(f"✓ Daphne installed: {daphne.__version__}")
except ImportError:
    print("✗ Daphne NOT installed! Run: pip install daphne")
    sys.exit(1)

# Check ASGI application
try:
    from Gawulo.asgi import application
    print("✓ ASGI application configured")
except Exception as e:
    print(f"✗ ASGI application error: {e}")
    sys.exit(1)

# Check channel layers
if hasattr(settings, 'CHANNEL_LAYERS'):
    print(f"✓ Channel layers configured: {settings.CHANNEL_LAYERS['default']['BACKEND']}")
else:
    print("✗ Channel layers NOT configured!")

# Check if orders app has consumers
try:
    from orders import consumers
    print("✓ Orders consumers imported successfully")
except Exception as e:
    print(f"✗ Error importing consumers: {e}")
    sys.exit(1)

# Check routing
try:
    from orders.routing import websocket_urlpatterns
    print(f"✓ WebSocket routing configured with {len(websocket_urlpatterns)} patterns")
except Exception as e:
    print(f"✗ Error importing routing: {e}")
    sys.exit(1)

# Check signals
try:
    from orders import signals
    print("✓ Orders signals imported")
except Exception as e:
    print(f"✗ Error importing signals: {e}")

print("=" * 60)
print("Configuration looks good!")
print("=" * 60)
print("\nTo start the server with WebSocket support, run:")
print("  daphne -b 0.0.0.0 -p 9033 Gawulo.asgi:application")
print("\nDO NOT use: python manage.py runserver (it doesn't support WebSockets)")

