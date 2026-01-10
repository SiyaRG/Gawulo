from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from .models import Order, OrderLineItem, OrderStatusHistory, Review
from auth_api.models import Customer
from .serializers import (
    OrderSerializer, 
    OrderLineItemSerializer, 
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
    ReviewSerializer
)


class OrderListView(generics.ListAPIView):
    """List all orders (admin only)."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
    filterset_fields = ['current_status', 'is_completed', 'vendor']
    search_fields = ['order_uid', 'customer__display_name', 'vendor__name']
    ordering_fields = ['created_at', 'total_amount', 'current_status']


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
        else:
            # Check if user is a vendor
            try:
                vendor = user.vendor_profile
                return Order.objects.filter(vendor=vendor)
            except:
                from vendors.models import Vendor
                try:
                    vendor = Vendor.objects.get(user=user)
                    return Order.objects.filter(vendor=vendor)
                except Vendor.DoesNotExist:
                    # Not a vendor, check if customer
                    try:
                        customer = Customer.objects.get(user=user)
                        return Order.objects.filter(customer=customer)
                    except Customer.DoesNotExist:
                        return Order.objects.none()


class OrderCreateView(generics.CreateAPIView):
    """Create a new order."""
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create order with customer and calculate totals."""
        # Get or create customer profile
        customer, _ = Customer.objects.get_or_create(user=self.request.user)
        order = serializer.save(customer=customer)
        
        # Calculate order totals from line items (after they're created by serializer)
        total_amount = sum(item.line_total for item in order.line_items.all())
        order.total_amount = total_amount
        order.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status=order.current_status,
            confirmed_by_user=self.request.user
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
        else:
            # Check if user is a vendor
            try:
                vendor = user.vendor_profile
                return Order.objects.filter(vendor=vendor)
            except:
                from vendors.models import Vendor
                try:
                    vendor = Vendor.objects.get(user=user)
                    return Order.objects.filter(vendor=vendor)
                except Vendor.DoesNotExist:
                    # Not a vendor, check if customer
                    try:
                        customer = Customer.objects.get(user=user)
                        return Order.objects.filter(customer=customer)
                    except Customer.DoesNotExist:
                        return Order.objects.none()
    
    def perform_update(self, serializer):
        """Update order status and create history entry."""
        old_status = self.get_object().current_status
        order = serializer.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status=order.current_status,
            confirmed_by_user=self.request.user
        )


class MyOrdersView(generics.ListAPIView):
    """Get orders for the current customer."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['current_status', 'is_completed']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_queryset(self):
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Order.objects.filter(customer=customer)
        except Customer.DoesNotExist:
            return Order.objects.none()


class VendorOrdersView(generics.ListAPIView):
    """Get orders for the current vendor."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['current_status', 'is_completed']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_queryset(self):
        try:
            vendor = self.request.user.vendor_profile
            return Order.objects.filter(vendor=vendor)
        except:
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=self.request.user)
                return Order.objects.filter(vendor=vendor)
            except Vendor.DoesNotExist:
                return Order.objects.none()


class ReviewCreateView(generics.CreateAPIView):
    """Create a review for a completed order."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create review with customer and vendor from order."""
        order = get_object_or_404(Order, pk=self.kwargs['order_id'])
        
        # Check if review already exists
        if Review.objects.filter(order=order).exists():
            raise serializers.ValidationError("Review already exists for this order.")
        
        # Get customer profile
        try:
            customer = Customer.objects.get(user=self.request.user)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("Customer profile not found.")
        
        # Verify order belongs to customer
        if order.customer != customer:
            raise serializers.ValidationError("Order does not belong to this customer.")
        
        serializer.save(
            order=order,
            vendor=order.vendor,
            customer=customer
        )


class ReviewDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Get, update, or delete a review."""
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    lookup_field = 'pk'
