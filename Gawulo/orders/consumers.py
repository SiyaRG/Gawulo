"""
WebSocket consumers for real-time order updates.
"""
import json
import urllib.parse
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from jwt import decode as jwt_decode
from django.conf import settings
from .models import Order
from .serializers import OrderSerializer
from vendors.models import Vendor
from auth_api.models import Customer


class OrderConsumer(AsyncWebsocketConsumer):
    """Base consumer for order updates."""
    
    async def connect(self):
        """Handle WebSocket connection."""
        try:
            client_info = self.scope.get('client', ['unknown'])
            query_string_raw = self.scope.get('query_string', b'')
            query_string = query_string_raw.decode('utf-8') if query_string_raw else ''
            print("=" * 60)
            print(f"WebSocket connection attempt from {client_info}")
            print(f"Full query string: {query_string}")
            print(f"Scope keys: {list(self.scope.keys())}")
            print(f"Path: {self.scope.get('path', 'unknown')}")
            print("=" * 60)
            
            # Get token from query string
            token = None
            
            # Parse query string
            if query_string:
                params = query_string.split('&')
                for param in params:
                    if param.startswith('token='):
                        token = param.split('token=')[1]
                        # URL decode the token
                        token = urllib.parse.unquote(token)
                        break
            
            if not token:
                print("✗ WebSocket connection rejected: No token provided")
                print("=" * 60)
                await self.close(code=4001)
                return
            
            # Authenticate user
            try:
                print(f"Authenticating token (length: {len(token)})...")
                user = await self.authenticate_token(token)
                if not user:
                    print("✗ WebSocket connection rejected: Authentication failed")
                    print("=" * 60)
                    await self.close(code=4003)
                    return
                print(f"✓ Authentication successful for user: {user.username} (ID: {user.id})")
            except Exception as e:
                print(f"✗ WebSocket authentication error: {e}")
                import traceback
                traceback.print_exc()
                print("=" * 60)
                await self.close(code=4003)
                return
            
            self.user = user
            self.user_id = user.id
            
            # Determine if user is vendor or customer
            try:
                self.is_vendor = await self.is_user_vendor(user)
                self.is_customer = await self.is_user_customer(user)
            except Exception as e:
                print(f"Error checking user type: {e}")
                import traceback
                traceback.print_exc()
                await self.close(code=4004)
                return
            
            if not (self.is_vendor or self.is_customer):
                print(f"User {user.username} is neither vendor nor customer")
                await self.close(code=4004)
                return
            
            # Get vendor or customer ID
            try:
                if self.is_vendor:
                    vendor = await self.get_vendor(user)
                    if vendor:
                        self.vendor_id = vendor.id
                        self.group_name = f'vendor_{self.vendor_id}_orders'
                    else:
                        print(f"Vendor profile not found for user {user.username}")
                        await self.close(code=4005)
                        return
                else:
                    customer = await self.get_customer(user)
                    if customer:
                        self.customer_id = customer.id
                        self.group_name = f'customer_{self.customer_id}_orders'
                    else:
                        print(f"Customer profile not found for user {user.username}")
                        await self.close(code=4006)
                        return
            except Exception as e:
                print(f"Error getting vendor/customer: {e}")
                import traceback
                traceback.print_exc()
                await self.close(code=4007)
                return
        
            # Join group
            print(f"Attempting to join group: {self.group_name}")
            print(f"Channel name: {self.channel_name}")
            print(f"Channel layer: {self.channel_layer}")
            
            if not self.channel_layer:
                print("✗ ERROR: Channel layer is None!")
                print("=" * 60)
                await self.close(code=4008)
                return
            
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            print(f"✓ Successfully joined group: {self.group_name}")
            
            await self.accept()
            print(f"✓ WebSocket connected: {self.group_name} for user {self.user.username} (ID: {self.user.id})")
            print("=" * 60)
        except Exception as e:
            print(f"✗ Unexpected error in connect(): {e}")
            import traceback
            traceback.print_exc()
            print("=" * 60)
            try:
                await self.close(code=4000)
            except:
                pass
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection."""
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages received from WebSocket."""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
        except json.JSONDecodeError:
            pass
    
    async def order_update(self, event):
        """Send order update to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'order': event['order'],
            'timestamp': event['timestamp']
        }))
    
    async def new_order(self, event):
        """Send new order notification to WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'new_order',
            'order': event['order'],
            'timestamp': event['timestamp']
        }))
    
    @database_sync_to_async
    def authenticate_token(self, token):
        """Authenticate JWT token and return user."""
        try:
            # Validate token
            UntypedToken(token)
        except (InvalidToken, TokenError) as e:
            print(f"Token validation error: {e}")
            return None
        
        try:
            # Decode token
            decoded_data = jwt_decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded_data.get('user_id')
            if not user_id:
                print("No user_id in token")
                return None
            
            # Get user
            try:
                user = User.objects.get(id=user_id)
                return user
            except User.DoesNotExist:
                print(f"User {user_id} does not exist")
                return None
        except Exception as e:
            print(f"Token decode error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    @database_sync_to_async
    def is_user_vendor(self, user):
        """Check if user is a vendor."""
        try:
            return hasattr(user, 'vendor_profile') and user.vendor_profile is not None
        except:
            # Try alternative method
            try:
                Vendor.objects.get(user=user)
                return True
            except Vendor.DoesNotExist:
                return False
    
    @database_sync_to_async
    def is_user_customer(self, user):
        """Check if user is a customer."""
        try:
            return hasattr(user, 'customer_profile') and user.customer_profile is not None
        except:
            # Try alternative method
            try:
                Customer.objects.get(user=user)
                return True
            except Customer.DoesNotExist:
                return False
    
    @database_sync_to_async
    def get_vendor(self, user):
        """Get vendor for user."""
        try:
            if hasattr(user, 'vendor_profile'):
                return user.vendor_profile
            return Vendor.objects.get(user=user)
        except:
            return None
    
    @database_sync_to_async
    def get_customer(self, user):
        """Get customer for user."""
        try:
            if hasattr(user, 'customer_profile'):
                return user.customer_profile
            return Customer.objects.get(user=user)
        except:
            return None


class VendorOrderConsumer(OrderConsumer):
    """Consumer for vendor order updates."""
    pass


class CustomerOrderConsumer(OrderConsumer):
    """Consumer for customer order updates."""
    pass

