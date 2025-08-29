from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Vendor, MenuItem, MenuCategory, VendorReview
from .serializers import (
    VendorSerializer, 
    MenuItemSerializer, 
    MenuCategorySerializer,
    VendorReviewSerializer,
    VendorRegistrationSerializer
)
from django.db import models


class VendorListView(generics.ListAPIView):
    """List all active vendors."""
    queryset = Vendor.objects.filter(status='active', is_verified=True)
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['business_type', 'delivery_radius']
    search_fields = ['business_name', 'description']
    ordering_fields = ['rating', 'total_orders', 'created_at']


class VendorDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific vendor."""
    queryset = Vendor.objects.filter(status='active', is_verified=True)
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'


class VendorRegistrationView(generics.CreateAPIView):
    """Register a new vendor."""
    serializer_class = VendorRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]


class VendorUpdateView(generics.UpdateAPIView):
    """Update vendor information."""
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only allow vendors to update their own profile."""
        if hasattr(self.request.user, 'vendor_profile'):
            return Vendor.objects.filter(user=self.request.user)
        return Vendor.objects.none()


class VendorMenuView(generics.ListAPIView):
    """Get menu items for a specific vendor."""
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        vendor = get_object_or_404(Vendor, pk=self.kwargs['pk'])
        return MenuItem.objects.filter(vendor=vendor, availability_status='available')


class VendorReviewsView(generics.ListCreateAPIView):
    """Get and create reviews for a vendor."""
    serializer_class = VendorReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        vendor = get_object_or_404(Vendor, pk=self.kwargs['pk'])
        return VendorReview.objects.filter(vendor=vendor)
    
    def perform_create(self, serializer):
        vendor = get_object_or_404(Vendor, pk=self.kwargs['pk'])
        serializer.save(vendor=vendor, customer=self.request.user)


class MenuItemListView(generics.ListAPIView):
    """List all available menu items."""
    queryset = MenuItem.objects.filter(availability_status='available')
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vendor', 'category', 'price']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'name']


class MenuItemDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific menu item."""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'


class MenuItemCreateView(generics.CreateAPIView):
    """Create a new menu item."""
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Set the vendor automatically based on the authenticated user."""
        if hasattr(self.request.user, 'vendor_profile'):
            serializer.save(vendor=self.request.user.vendor_profile)
        else:
            raise permissions.PermissionDenied("Only vendors can create menu items.")


class MenuItemUpdateView(generics.UpdateAPIView):
    """Update a menu item."""
    serializer_class = MenuItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only allow vendors to update their own menu items."""
        if hasattr(self.request.user, 'vendor_profile'):
            return MenuItem.objects.filter(vendor=self.request.user.vendor_profile)
        return MenuItem.objects.none()


class MenuItemDeleteView(generics.DestroyAPIView):
    """Delete a menu item."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Only allow vendors to delete their own menu items."""
        if hasattr(self.request.user, 'vendor_profile'):
            return MenuItem.objects.filter(vendor=self.request.user.vendor_profile)
        return MenuItem.objects.none()


class MenuCategoryListView(generics.ListAPIView):
    """List all menu categories."""
    queryset = MenuCategory.objects.filter(is_active=True)
    serializer_class = MenuCategorySerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vendor']


class MenuCategoryCreateView(generics.CreateAPIView):
    """Create a new menu category."""
    serializer_class = MenuCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Set the vendor automatically based on the authenticated user."""
        if hasattr(self.request.user, 'vendor_profile'):
            serializer.save(vendor=self.request.user.vendor_profile)
        else:
            raise permissions.PermissionDenied("Only vendors can create menu categories.")


class VendorStatsView(APIView):
    """Get vendor statistics."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, pk):
        """Get vendor statistics."""
        vendor = get_object_or_404(Vendor, pk=pk)
        
        # Only allow vendors to see their own stats or admin users
        if not (request.user.is_staff or 
                (hasattr(request.user, 'vendor_profile') and request.user.vendor_profile == vendor)):
            raise permissions.PermissionDenied("You can only view your own statistics.")
        
        stats = {
            'total_menu_items': vendor.menu_items.count(),
            'total_reviews': vendor.reviews.count(),
            'average_rating': vendor.get_average_rating(),
            'total_orders': vendor.total_orders,
            'is_operating': vendor.is_operating_now(),
            'can_accept_orders': vendor.can_accept_orders(),
        }
        
        return Response(stats)


class VendorSearchView(generics.ListAPIView):
    """Search vendors by various criteria."""
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        queryset = Vendor.objects.filter(status='active', is_verified=True)
        
        # Filter by business type
        business_type = self.request.query_params.get('business_type', None)
        if business_type:
            queryset = queryset.filter(business_type=business_type)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.filter(rating__gte=min_rating)
        
        # Filter by delivery radius
        max_delivery_radius = self.request.query_params.get('max_delivery_radius', None)
        if max_delivery_radius:
            queryset = queryset.filter(delivery_radius__lte=max_delivery_radius)
        
        # Search by name or description
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(business_name__icontains=search) |
                models.Q(description__icontains=search)
            )
        
        return queryset
