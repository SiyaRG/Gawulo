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
