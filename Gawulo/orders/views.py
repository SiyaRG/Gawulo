from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.db import models
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Order, OrderLineItem, OrderStatusHistory, Review, RefundRequest
from auth_api.models import Customer
from .serializers import (
    OrderSerializer, 
    OrderLineItemSerializer, 
    OrderCreateSerializer,
    OrderStatusUpdateSerializer,
    OrderEstimatedTimeUpdateSerializer,
    ReviewSerializer,
    RefundRequestSerializer,
    RefundRequestCreateSerializer
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
            queryset = Order.objects.filter(customer=customer)
            
            # Filter by status if provided
            status_filter = self.request.query_params.get('status', None)
            if status_filter:
                queryset = queryset.filter(current_status=status_filter)
            
            # Filter by date range if provided
            date_from = self.request.query_params.get('date_from', None)
            date_to = self.request.query_params.get('date_to', None)
            if date_from:
                try:
                    date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                    queryset = queryset.filter(created_at__gte=date_from_obj)
                except ValueError:
                    pass
            if date_to:
                try:
                    date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                    # Add one day to include the entire end date
                    date_to_obj = date_to_obj + timedelta(days=1)
                    queryset = queryset.filter(created_at__lt=date_to_obj)
                except ValueError:
                    pass
            
            # Search by order UID if provided
            search = self.request.query_params.get('search', None)
            if search:
                queryset = queryset.filter(order_uid__icontains=search)
            
            # Ordering
            ordering = self.request.query_params.get('ordering', '-created_at')
            if ordering:
                queryset = queryset.order_by(ordering)
            
            return queryset
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
            queryset = Order.objects.filter(vendor=vendor)
        except:
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=self.request.user)
                queryset = Order.objects.filter(vendor=vendor)
            except Vendor.DoesNotExist:
                return Order.objects.none()
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(current_status=status_filter)
        
        # Filter by date range if provided
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__gte=date_from_obj)
            except ValueError:
                pass
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                # Add one day to include the entire end date
                date_to_obj = date_to_obj + timedelta(days=1)
                queryset = queryset.filter(created_at__lt=date_to_obj)
            except ValueError:
                pass
        
        # Search by order UID or customer name if provided
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(order_uid__icontains=search) |
                models.Q(customer__display_name__icontains=search)
            )
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_at')
        if ordering:
            queryset = queryset.order_by(ordering)
        
        return queryset


class MyReviewsView(generics.ListAPIView):
    """Get all reviews for the authenticated customer."""
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return all reviews for the authenticated customer."""
        try:
            customer = Customer.objects.get(user=self.request.user)
            return Review.objects.filter(customer=customer).select_related('order', 'vendor', 'customer').order_by('-created_at')
        except Customer.DoesNotExist:
            return Review.objects.none()


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
        
        # Verify order is completed (either delivered, picked up, or refunded)
        if order.current_status not in ['Delivered', 'PickedUp', 'Refunded']:
            raise serializers.ValidationError(
                f"You can only review completed orders (delivered, picked up, or refunded). "
                f"Current order status: {order.current_status}"
            )
        
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


class OrderCancelView(APIView):
    """Cancel an order."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Cancel an order."""
        order = get_object_or_404(Order, pk=pk)
        user = request.user
        
        # Check permissions
        is_customer = False
        is_vendor = False
        is_admin = user.is_staff
        
        try:
            customer = Customer.objects.get(user=user)
            if order.customer == customer:
                is_customer = True
        except Customer.DoesNotExist:
            pass
        
        try:
            from vendors.models import Vendor
            vendor = Vendor.objects.get(user=user)
            if order.vendor == vendor:
                is_vendor = True
        except:
            try:
                vendor = user.vendor_profile
                if order.vendor == vendor:
                    is_vendor = True
            except:
                pass
        
        if not (is_customer or is_vendor or is_admin):
            return Response(
                {'error': 'You do not have permission to cancel this order.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if order can be cancelled
        if order.current_status in ['Delivered', 'Cancelled', 'Refunded']:
            return Response(
                {'error': f'Cannot cancel order with status: {order.current_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # For customers, only allow cancellation of Confirmed or Pending orders
        if is_customer and order.current_status not in ['Confirmed', 'Pending']:
            return Response(
                {'error': f'Customers can only cancel orders with status Confirmed or Pending. Current status: {order.current_status}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Cancel the order
        order.current_status = 'Cancelled'
        order.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status='Cancelled',
            confirmed_by_user=user
        )
        
        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class OrderEstimatedTimeUpdateView(generics.UpdateAPIView):
    """Update estimated ready time for an order."""
    queryset = Order.objects.all()
    serializer_class = OrderEstimatedTimeUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter orders based on user role - only vendors can update estimated time."""
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
                    return Order.objects.none()


class OrderStatsView(APIView):
    """Get order statistics for the authenticated user."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get order statistics."""
        user = request.user
        
        # Determine if user is customer or vendor
        is_customer = False
        is_vendor = False
        
        try:
            customer = Customer.objects.get(user=user)
            is_customer = True
            orders = Order.objects.filter(customer=customer)
        except Customer.DoesNotExist:
            pass
        
        if not is_customer:
            try:
                from vendors.models import Vendor
                vendor = Vendor.objects.get(user=user)
                is_vendor = True
                orders = Order.objects.filter(vendor=vendor)
            except:
                try:
                    vendor = user.vendor_profile
                    is_vendor = True
                    orders = Order.objects.filter(vendor=vendor)
                except:
                    orders = Order.objects.none()
        
        # Calculate statistics
        total_orders = orders.count()
        by_status = {}
        for status_choice in Order.ORDER_STATUS:
            status_value = status_choice[0]
            count = orders.filter(current_status=status_value).count()
            by_status[status_value] = count
        
        # Calculate total revenue (for vendors) - include both delivered and picked up orders
        total_revenue = None
        if is_vendor:
            from django.db.models import Sum
            total_revenue = float(orders.filter(
                current_status__in=['Delivered', 'PickedUp']
            ).aggregate(
                total=Sum('total_amount')
            )['total'] or 0)
        
        # Recent orders (last 7 days)
        from django.utils import timezone
        from datetime import timedelta
        recent_date = timezone.now() - timedelta(days=7)
        recent_orders_count = orders.filter(created_at__gte=recent_date).count()
        
        stats = {
            'total_orders': total_orders,
            'by_status': by_status,
            'recent_orders_count': recent_orders_count,
        }
        
        if total_revenue is not None:
            stats['total_revenue'] = total_revenue
        
        return Response(stats, status=status.HTTP_200_OK)


class RefundRequestCreateView(generics.CreateAPIView):
    """Create a refund request for an order."""
    serializer_class = RefundRequestCreateSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create refund request for the authenticated customer."""
        try:
            customer = Customer.objects.get(user=self.request.user)
        except Customer.DoesNotExist:
            raise serializers.ValidationError("User does not have a customer profile.")
        
        serializer.save(requested_by=customer)


class RefundRequestListView(generics.ListAPIView):
    """List refund requests filtered by user role."""
    serializer_class = RefundRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter refund requests based on user role."""
        user = self.request.user
        
        if user.is_staff:
            # Admins can see all refund requests
            return RefundRequest.objects.all().select_related('order', 'requested_by', 'processed_by')
        
        # Check if user is a vendor
        try:
            vendor = user.vendor_profile
            # Vendors can see refund requests for their orders
            return RefundRequest.objects.filter(order__vendor=vendor).select_related('order', 'requested_by', 'processed_by')
        except:
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=user)
                return RefundRequest.objects.filter(order__vendor=vendor).select_related('order', 'requested_by', 'processed_by')
            except Vendor.DoesNotExist:
                # Check if user is a customer
                try:
                    customer = Customer.objects.get(user=user)
                    # Customers can see their own refund requests
                    return RefundRequest.objects.filter(requested_by=customer).select_related('order', 'requested_by', 'processed_by')
                except Customer.DoesNotExist:
                    return RefundRequest.objects.none()


class RefundRequestApproveView(generics.UpdateAPIView):
    """Approve a refund request."""
    queryset = RefundRequest.objects.all()
    serializer_class = RefundRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter refund requests based on user role - only pending requests."""
        user = self.request.user
        
        if user.is_staff:
            return RefundRequest.objects.filter(status='pending')
        
        # Check if user is a vendor
        try:
            vendor = user.vendor_profile
            return RefundRequest.objects.filter(order__vendor=vendor, status='pending')
        except:
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=user)
                return RefundRequest.objects.filter(order__vendor=vendor, status='pending')
            except Vendor.DoesNotExist:
                return RefundRequest.objects.none()
    
    def get_object(self):
        """Get refund request with better error handling."""
        try:
            return super().get_object()
        except Http404:
            # Check if the refund request exists but is not pending
            pk = self.kwargs.get('pk')
            try:
                refund_request = RefundRequest.objects.get(pk=pk)
                if refund_request.status == 'approved':
                    raise serializers.ValidationError(
                        "This refund request has already been approved and cannot be modified."
                    )
                elif refund_request.status == 'denied':
                    raise serializers.ValidationError(
                        "This refund request has already been denied and cannot be modified."
                    )
                else:
                    raise serializers.ValidationError(
                        "This refund request is no longer pending and cannot be approved."
                    )
            except RefundRequest.DoesNotExist:
                raise Http404("Refund request not found.")
            except serializers.ValidationError:
                raise
            except Exception:
                raise Http404("Refund request not found or you do not have permission to access it.")
    
    def perform_update(self, serializer):
        """Approve refund request and update order status."""
        refund_request = self.get_object()
        
        # Double-check status is pending (defense in depth)
        if refund_request.status != 'pending':
            raise serializers.ValidationError("Only pending refund requests can be approved.")
        
        # Prevent approval if order is already refunded
        if refund_request.order.current_status == 'Refunded':
            raise serializers.ValidationError("This order has already been refunded.")
        
        # Update refund request
        refund_request.status = 'approved'
        refund_request.processed_by = self.request.user
        refund_request.processed_at = timezone.now()
        refund_request.save()
        
        # Update order status to Refunded
        order = refund_request.order
        order.current_status = 'Refunded'
        order.save()
        
        # Create status history entry
        OrderStatusHistory.objects.create(
            order=order,
            status='Refunded',
            confirmed_by_user=self.request.user
        )


class RefundRequestDenyView(generics.UpdateAPIView):
    """Deny a refund request."""
    queryset = RefundRequest.objects.all()
    serializer_class = RefundRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter refund requests based on user role - only pending requests."""
        user = self.request.user
        
        if user.is_staff:
            return RefundRequest.objects.filter(status='pending')
        
        # Check if user is a vendor
        try:
            vendor = user.vendor_profile
            return RefundRequest.objects.filter(order__vendor=vendor, status='pending')
        except:
            from vendors.models import Vendor
            try:
                vendor = Vendor.objects.get(user=user)
                return RefundRequest.objects.filter(order__vendor=vendor, status='pending')
            except Vendor.DoesNotExist:
                return RefundRequest.objects.none()
    
    def get_object(self):
        """Get refund request with better error handling."""
        try:
            return super().get_object()
        except Http404:
            # Check if the refund request exists but is not pending
            pk = self.kwargs.get('pk')
            try:
                refund_request = RefundRequest.objects.get(pk=pk)
                if refund_request.status == 'approved':
                    raise serializers.ValidationError(
                        "This refund request has already been approved and cannot be modified."
                    )
                elif refund_request.status == 'denied':
                    raise serializers.ValidationError(
                        "This refund request has already been denied and cannot be modified."
                    )
                else:
                    raise serializers.ValidationError(
                        "This refund request is no longer pending and cannot be denied."
                    )
            except RefundRequest.DoesNotExist:
                raise Http404("Refund request not found.")
            except serializers.ValidationError:
                raise
            except Exception:
                raise Http404("Refund request not found or you do not have permission to access it.")
    
    def update(self, request, *args, **kwargs):
        """Deny refund request with optional reason."""
        try:
            refund_request = self.get_object()
        except serializers.ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Double-check status is pending (defense in depth)
        if refund_request.status != 'pending':
            return Response(
                {'error': 'Only pending refund requests can be denied.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        denial_reason = request.data.get('denial_reason', '')
        
        # Update refund request
        refund_request.status = 'denied'
        refund_request.processed_by = request.user
        refund_request.processed_at = timezone.now()
        if denial_reason:
            refund_request.denial_reason = denial_reason
        refund_request.save()
        
        serializer = self.get_serializer(refund_request)
        return Response(serializer.data, status=status.HTTP_200_OK)
