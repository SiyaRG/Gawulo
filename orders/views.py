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


class OrderUpdateView(generics.UpdateAPIView):
    """Update order details."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter orders based on user role."""
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        elif hasattr(user, 'vendor_profile'):
            return Order.objects.filter(vendor=user.vendor_profile)
        else:
            return Order.objects.filter(customer=user)


class OrderDeleteView(generics.DestroyAPIView):
    """Delete an order (only if it's still pending)."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only allow deletion of pending orders."""
        user = self.request.user
        if user.is_staff:
            return Order.objects.filter(status='pending')
        elif hasattr(user, 'vendor_profile'):
            return Order.objects.filter(vendor=user.vendor_profile, status='pending')
        else:
            return Order.objects.filter(customer=user, status='pending')
    
    def perform_destroy(self, instance):
        """Create a cancellation history entry before deleting."""
        OrderStatusHistory.objects.create(
            order=instance,
            status='cancelled',
            notes='Order cancelled by user',
            updated_by=self.request.user
        )
        instance.delete()


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


class OrderStatsView(APIView):
    """Get order statistics."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get order statistics for the authenticated user."""
        user = request.user
        
        if user.is_staff:
            # Admin stats
            total_orders = Order.objects.count()
            pending_orders = Order.objects.filter(status='pending').count()
            completed_orders = Order.objects.filter(status='delivered').count()
            total_revenue = sum(order.total_amount for order in Order.objects.filter(status='delivered'))
        elif hasattr(user, 'vendor_profile'):
            # Vendor stats
            vendor_orders = Order.objects.filter(vendor=user.vendor_profile)
            total_orders = vendor_orders.count()
            pending_orders = vendor_orders.filter(status='pending').count()
            completed_orders = vendor_orders.filter(status='delivered').count()
            total_revenue = sum(order.total_amount for order in vendor_orders.filter(status='delivered'))
        else:
            # Customer stats
            customer_orders = Order.objects.filter(customer=user)
            total_orders = customer_orders.count()
            pending_orders = customer_orders.filter(status='pending').count()
            completed_orders = customer_orders.filter(status='delivered').count()
            total_revenue = sum(order.total_amount for order in customer_orders.filter(status='delivered'))
        
        stats = {
            'total_orders': total_orders,
            'pending_orders': pending_orders,
            'completed_orders': completed_orders,
            'total_revenue': float(total_revenue),
            'completion_rate': (completed_orders / total_orders * 100) if total_orders > 0 else 0
        }
        
        return Response(stats)


class OrderSearchView(generics.ListAPIView):
    """Search orders by various criteria."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_staff:
            queryset = Order.objects.all()
        elif hasattr(user, 'vendor_profile'):
            queryset = Order.objects.filter(vendor=user.vendor_profile)
        else:
            queryset = Order.objects.filter(customer=user)
        
        # Filter by status
        status = self.request.query_params.get('status', None)
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by delivery type
        delivery_type = self.request.query_params.get('delivery_type', None)
        if delivery_type:
            queryset = queryset.filter(delivery_type=delivery_type)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date', None)
        if start_date:
            queryset = queryset.filter(created_at__date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date', None)
        if end_date:
            queryset = queryset.filter(created_at__date__lte=end_date)
        
        # Search by order number
        order_number = self.request.query_params.get('order_number', None)
        if order_number:
            queryset = queryset.filter(order_number__icontains=order_number)
        
        return queryset
