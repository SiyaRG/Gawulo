from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Vendor, ProductService
from orders.models import Review
from .serializers import (
    VendorSerializer, 
    ProductServiceSerializer,
    VendorRegistrationSerializer
)


class VendorListView(generics.ListAPIView):
    """List all active vendors."""
    queryset = Vendor.objects.filter(is_verified=True, deleted_at__isnull=True)
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['category', 'is_verified']
    search_fields = ['name', 'profile_description']
    ordering_fields = ['average_rating', 'review_count', 'created_at']


class VendorDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific vendor."""
    queryset = Vendor.objects.filter(deleted_at__isnull=True)
    serializer_class = VendorSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'


class VendorRegistrationView(generics.CreateAPIView):
    """Register a new vendor."""
    serializer_class = VendorRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]


class VendorProductsServicesView(generics.ListAPIView):
    """Get products/services for a specific vendor."""
    serializer_class = ProductServiceSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        vendor = get_object_or_404(Vendor, pk=self.kwargs['pk'], deleted_at__isnull=True)
        return ProductService.objects.filter(vendor=vendor, deleted_at__isnull=True)


class VendorReviewsView(generics.ListCreateAPIView):
    """Get and create reviews for a vendor."""
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        from orders.serializers import ReviewSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        vendor = get_object_or_404(Vendor, pk=self.kwargs['pk'], deleted_at__isnull=True)
        return Review.objects.filter(vendor=vendor)
    
    def perform_create(self, serializer):
        vendor = get_object_or_404(Vendor, pk=self.kwargs['pk'], deleted_at__isnull=True)
        # Get or create customer profile for the user
        from auth_api.models import Customer
        customer, _ = Customer.objects.get_or_create(user=self.request.user)
        serializer.save(vendor=vendor, customer=customer)


class ProductServiceListView(generics.ListAPIView):
    """List all available products/services."""
    queryset = ProductService.objects.filter(deleted_at__isnull=True)
    serializer_class = ProductServiceSerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ['vendor', 'is_service']
    search_fields = ['name', 'description']
    ordering_fields = ['current_price', 'name', 'created_at']


class ProductServiceDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific product/service."""
    queryset = ProductService.objects.filter(deleted_at__isnull=True)
    serializer_class = ProductServiceSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'pk'
