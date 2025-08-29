from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Order, OrderItem, OrderStatusHistory, OrderRating
from .serializers import (
    OrderSerializer, 
    OrderItemSerializer, 
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
    OrderRatingSerializer
)


class OrderListView(generics.ListAPIView):
    """List all orders (admin only)."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['status', 'delivery_type', 'vendor']
    search_fields = ['order_number', 'customer__username', 'vendor__business_name']
    ordering_fields = ['created_at', 'total_amount', 'status']


class OrderDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific order."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter orders based on user role."""
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        elif hasattr(user, 'vendor_profile'):
            return Order.objects.filter(vendor=user.vendor_profile)
        else:
            return Order.objects.filter(customer=user)


class OrderCreateView(generics.CreateAPIView):
    """Create a new order."""
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create order with customer and calculate totals."""
        order = serializer.save(customer=self.request.user)
        
        # Calculate order totals
        subtotal = sum(item.total_price for item in order.items.all())
        delivery_fee = order.vendor.delivery_fee if order.delivery_type == 'delivery' else 0
        tax_amount = subtotal * 0.15  # 15% VAT
        total_amount = subtotal + delivery_fee + tax_amount
        
        order.subtotal = subtotal
        order.delivery_fee = delivery_fee
        order.tax_amount = tax_amount
        order.total_amount = total_amount
        order.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status='pending',
            notes='Order created',
            updated_by=self.request.user
        )


class OrderStatusUpdateView(generics.UpdateAPIView):
    """Update order status."""
    queryset = Order.objects.all()
    serializer_class = OrderStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter orders based on user role."""
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        elif hasattr(user, 'vendor_profile'):
            return Order.objects.filter(vendor=user.vendor_profile)
        else:
            return Order.objects.filter(customer=user)
    
    def perform_update(self, serializer):
        """Update order status and create history entry."""
        old_status = self.get_object().status
        order = serializer.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status=order.status,
            notes=f'Status changed from {old_status} to {order.status}',
            updated_by=self.request.user
        )


class MyOrdersView(generics.ListAPIView):
    """Get orders for the current customer."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'delivery_type']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user)


class VendorOrdersView(generics.ListAPIView):
    """Get orders for the current vendor."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['status', 'delivery_type']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_queryset(self):
        if hasattr(self.request.user, 'vendor_profile'):
            return Order.objects.filter(vendor=self.request.user.vendor_profile)
        return Order.objects.none()
