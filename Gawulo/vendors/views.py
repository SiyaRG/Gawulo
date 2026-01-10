from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from .models import Vendor, ProductService, ProductImage, VendorImage
from orders.models import Review
from .serializers import (
    VendorSerializer, 
    ProductServiceSerializer,
    VendorRegistrationSerializer,
    ProductImageSerializer,
    VendorImageSerializer
)
import os


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


class ProductServiceCreateView(generics.CreateAPIView):
    """Create a new product/service for authenticated vendor."""
    serializer_class = ProductServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create product/service and associate with vendor."""
        # Get vendor profile for authenticated user
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            raise permissions.PermissionDenied("User does not have a vendor profile.")
        serializer.save(vendor=vendor)


class ProductServiceUpdateView(generics.UpdateAPIView):
    """Update a product/service (vendor-owned only)."""
    serializer_class = ProductServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter to only vendor's own products/services."""
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            return ProductService.objects.none()
        return ProductService.objects.filter(vendor=vendor, deleted_at__isnull=True)
    
    def perform_update(self, serializer):
        """Update product/service."""
        serializer.save()


class ProductServiceDeleteView(generics.DestroyAPIView):
    """Soft delete a product/service (vendor-owned only)."""
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Filter to only vendor's own products/services."""
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            return ProductService.objects.none()
        return ProductService.objects.filter(vendor=vendor, deleted_at__isnull=True)
    
    def perform_destroy(self, instance):
        """Perform soft delete instead of hard delete."""
        instance.soft_delete()


class VendorProfileView(generics.RetrieveAPIView):
    """Get current vendor's profile (authenticated vendor only)."""
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Return vendor profile for authenticated user."""
        try:
            return self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            from rest_framework.exceptions import NotFound
            raise NotFound("User does not have a vendor profile.")


class MyVendorProductsServicesView(generics.ListAPIView):
    """Get products/services for the current authenticated vendor."""
    serializer_class = ProductServiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Disable pagination for vendor's own products list
    
    def get_queryset(self):
        """Return products/services for authenticated vendor."""
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            return ProductService.objects.none()
        return ProductService.objects.filter(vendor=vendor, deleted_at__isnull=True)


class VendorProfileUpdateView(generics.UpdateAPIView):
    """Update vendor profile (authenticated vendor only)."""
    serializer_class = VendorSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_object(self):
        """Return vendor profile for authenticated user."""
        try:
            return self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            raise permissions.PermissionDenied("User does not have a vendor profile.")
    
    def perform_update(self, serializer):
        """Update vendor profile."""
        # Don't allow updating read-only fields
        serializer.save()


class VendorStatsView(APIView):
    """Get statistics for authenticated vendor."""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return vendor statistics."""
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            # OneToOneField raises RelatedObjectDoesNotExist which inherits from AttributeError
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get products/services count
        products_count = ProductService.objects.filter(
            vendor=vendor, 
            deleted_at__isnull=True
        ).count()
        
        # Get orders data
        from orders.models import Order
        vendor_orders = Order.objects.filter(vendor=vendor)
        total_orders = vendor_orders.count()
        
        # Calculate today's revenue
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = vendor_orders.filter(
            created_at__gte=today_start,
            current_status__in=['Delivered', 'Shipped']
        )
        today_revenue = sum(order.total_amount for order in today_orders)
        
        # Calculate weekly revenue
        week_start = today_start - timedelta(days=7)
        week_orders = vendor_orders.filter(
            created_at__gte=week_start,
            current_status__in=['Delivered', 'Shipped']
        )
        week_revenue = sum(order.total_amount for order in week_orders)
        
        # Calculate monthly revenue
        month_start = today_start - timedelta(days=30)
        month_orders = vendor_orders.filter(
            created_at__gte=month_start,
            current_status__in=['Delivered', 'Shipped']
        )
        month_revenue = sum(order.total_amount for order in month_orders)
        
        # Order status breakdown
        status_breakdown = {}
        for status_choice in Order.ORDER_STATUS:
            status_key = status_choice[0]
            status_breakdown[status_key] = vendor_orders.filter(
                current_status=status_key
            ).count()
        
        # Popular products (top 5 by order count)
        from orders.models import OrderLineItem
        from django.db.models import Count, Sum
        popular_products = OrderLineItem.objects.filter(
            order__vendor=vendor,
            order__current_status__in=['Delivered', 'Shipped']
        ).values(
            'product_service__id',
            'product_service__name'
        ).annotate(
            order_count=Count('order'),
            total_quantity=Sum('quantity')
        ).order_by('-order_count')[:5]
        
        # Revenue trends (last 7 days)
        revenue_trends = []
        for i in range(7):
            day_start = today_start - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            day_orders = vendor_orders.filter(
                created_at__gte=day_start,
                created_at__lt=day_end,
                current_status__in=['Delivered', 'Shipped']
            )
            day_revenue = sum(order.total_amount for order in day_orders)
            revenue_trends.append({
                'date': day_start.date().isoformat(),
                'revenue': float(day_revenue)
            })
        revenue_trends.reverse()  # Oldest to newest
        
        stats = {
            'vendor_id': vendor.id,
            'vendor_name': vendor.name,
            'products_count': products_count,
            'total_orders': total_orders,
            'average_rating': float(vendor.average_rating),
            'review_count': vendor.review_count,
            'today_revenue': float(today_revenue),
            'week_revenue': float(week_revenue),
            'month_revenue': float(month_revenue),
            'status_breakdown': status_breakdown,
            'popular_products': list(popular_products),
            'revenue_trends': revenue_trends,
        }
        
        return Response(stats, status=status.HTTP_200_OK)


class VendorProfileImageUploadView(APIView):
    """Upload vendor profile image."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Upload or update vendor profile image."""
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if uploaded_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if uploaded_file.size > max_size:
            return Response(
                {'error': 'File size exceeds 5MB limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delete old image if it exists
            if vendor.profile_image:
                vendor.profile_image.delete(save=False)
            
            # Save new image
            vendor.profile_image = uploaded_file
            vendor.save()
            
            # Return updated vendor data
            serializer = VendorSerializer(vendor, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to upload profile image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """Delete vendor profile image."""
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            if vendor.profile_image:
                vendor.profile_image.delete(save=False)
                vendor.profile_image = None
                vendor.save()
            
            serializer = VendorSerializer(vendor, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete profile image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProductServiceImageUploadView(APIView):
    """Upload product/service image."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Upload or update product/service image."""
        try:
            product = ProductService.objects.get(pk=pk, deleted_at__isnull=True)
        except ProductService.DoesNotExist:
            return Response(
                {'error': 'Product/Service not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify vendor owns this product
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if product.vendor != vendor:
            return Response(
                {'error': 'You do not have permission to modify this product.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['file']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if uploaded_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (max 5MB)
        max_size = 5 * 1024 * 1024  # 5MB
        if uploaded_file.size > max_size:
            return Response(
                {'error': 'File size exceeds 5MB limit.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Delete old image if it exists
            if product.image:
                product.image.delete(save=False)
            
            # Save new image
            product.image = uploaded_file
            product.save()
            
            # Return updated product data
            serializer = ProductServiceSerializer(product, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to upload product image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request, pk):
        """Delete product/service image."""
        try:
            product = ProductService.objects.get(pk=pk, deleted_at__isnull=True)
        except ProductService.DoesNotExist:
            return Response(
                {'error': 'Product/Service not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify vendor owns this product
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if product.vendor != vendor:
            return Response(
                {'error': 'You do not have permission to modify this product.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            if product.image:
                product.image.delete(save=False)
                product.image = None
                product.save()
            
            serializer = ProductServiceSerializer(product, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete product image: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProductImageListView(generics.ListAPIView):
    """List all images for a product."""
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Return direct array, not paginated
    
    def get_queryset(self):
        """Return images for the specified product."""
        product_id = self.kwargs['pk']
        try:
            product = ProductService.objects.get(pk=product_id, deleted_at__isnull=True)
        except ProductService.DoesNotExist:
            return ProductImage.objects.none()
        
        # Verify vendor owns this product
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return ProductImage.objects.none()
        
        if product.vendor != vendor:
            return ProductImage.objects.none()
        
        return ProductImage.objects.filter(product_service=product).order_by('display_order', 'created_at')


class ProductImageUploadView(APIView):
    """Upload multiple images for a product."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        """Upload one or more images for a product."""
        try:
            product = ProductService.objects.get(pk=pk, deleted_at__isnull=True)
        except ProductService.DoesNotExist:
            return Response(
                {'error': 'Product/Service not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Verify vendor owns this product
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if product.vendor != vendor:
            return Response(
                {'error': 'You do not have permission to modify this product.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check current image count
        current_count = ProductImage.objects.filter(product_service=product).count()
        
        # Get files (can be multiple)
        files = request.FILES.getlist('files') if 'files' in request.FILES else []
        if not files:
            # Fallback to single 'file' field
            if 'file' in request.FILES:
                files = [request.FILES['file']]
            else:
                return Response(
                    {'error': 'No files provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if adding these files would exceed limit
        if current_count + len(files) > 5:
            return Response(
                {'error': f'Maximum 5 images allowed. Currently have {current_count}, trying to add {len(files)}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and upload files
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        max_size = 5 * 1024 * 1024  # 5MB
        
        uploaded_images = []
        has_preview = ProductImage.objects.filter(product_service=product, is_preview=True).exists()
        
        for uploaded_file in files:
            # Validate file type
            if uploaded_file.content_type not in allowed_types:
                continue  # Skip invalid files
            
            # Validate file size
            if uploaded_file.size > max_size:
                continue  # Skip oversized files
            
            try:
                # Create image record
                image = ProductImage.objects.create(
                    product_service=product,
                    image=uploaded_file,
                    is_preview=(not has_preview and len(uploaded_images) == 0),  # First image is preview if none exists
                    display_order=current_count + len(uploaded_images)
                )
                uploaded_images.append(image)
                if image.is_preview:
                    has_preview = True
            except Exception as e:
                continue  # Skip failed uploads
        
        if not uploaded_images:
            return Response(
                {'error': 'No valid images were uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return uploaded images
        serializer = ProductImageSerializer(uploaded_images, many=True, context={'request': request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class ProductImageUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Update or delete a product image."""
    serializer_class = ProductImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Return images for products owned by the authenticated vendor."""
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return ProductImage.objects.none()
        
        return ProductImage.objects.filter(product_service__vendor=vendor)
    
    def perform_update(self, serializer):
        """Update image, handling preview selection."""
        # Get the is_preview value from the request data before saving
        is_preview = serializer.validated_data.get('is_preview', False)
        
        # Get the instance before saving
        instance = self.get_object()
        
        # If setting as preview, unset others FIRST to avoid unique constraint violation
        if is_preview:
            # Unset all other preview images for this product BEFORE saving
            ProductImage.objects.filter(
                product_service=instance.product_service,
                is_preview=True
            ).exclude(id=instance.id).update(is_preview=False)
        
        # Now save the instance with the updated is_preview value
        instance = serializer.save()
        
        return instance
    
    def perform_destroy(self, instance):
        """Delete image file and record."""
        if instance.image:
            instance.image.delete(save=False)
        instance.delete()


class VendorImageListView(generics.ListAPIView):
    """List all images for the current vendor."""
    serializer_class = VendorImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Return direct array, not paginated
    
    def get_queryset(self):
        """Return images for the authenticated vendor."""
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return VendorImage.objects.none()
        
        return VendorImage.objects.filter(vendor=vendor).order_by('display_order', 'created_at')


class VendorImageUploadView(APIView):
    """Upload multiple images for vendor profile."""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        """Upload one or more images for vendor profile."""
        try:
            vendor = request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return Response(
                {"error": "User does not have a vendor profile."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check current image count
        current_count = VendorImage.objects.filter(vendor=vendor).count()
        
        # Get files (can be multiple)
        files = request.FILES.getlist('files') if 'files' in request.FILES else []
        if not files:
            # Fallback to single 'file' field
            if 'file' in request.FILES:
                files = [request.FILES['file']]
            else:
                return Response(
                    {'error': 'No files provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check if adding these files would exceed limit
        if current_count + len(files) > 5:
            return Response(
                {'error': f'Maximum 5 images allowed. Currently have {current_count}, trying to add {len(files)}.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate and upload files
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        max_size = 5 * 1024 * 1024  # 5MB
        
        uploaded_images = []
        has_preview = VendorImage.objects.filter(vendor=vendor, is_preview=True).exists()
        
        for uploaded_file in files:
            # Validate file type
            if uploaded_file.content_type not in allowed_types:
                continue  # Skip invalid files
            
            # Validate file size
            if uploaded_file.size > max_size:
                continue  # Skip oversized files
            
            try:
                # Create image record
                image = VendorImage.objects.create(
                    vendor=vendor,
                    image=uploaded_file,
                    is_preview=(not has_preview and len(uploaded_images) == 0),  # First image is preview if none exists
                    display_order=current_count + len(uploaded_images)
                )
                uploaded_images.append(image)
                if image.is_preview:
                    has_preview = True
            except Exception as e:
                continue  # Skip failed uploads
        
        if not uploaded_images:
            return Response(
                {'error': 'No valid images were uploaded.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return uploaded images
        serializer = VendorImageSerializer(uploaded_images, many=True, context={'request': request})
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )


class VendorImageUpdateView(generics.RetrieveUpdateDestroyAPIView):
    """Update or delete a vendor image."""
    serializer_class = VendorImageSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'
    
    def get_queryset(self):
        """Return images for the authenticated vendor."""
        try:
            vendor = self.request.user.vendor_profile
        except (Vendor.DoesNotExist, AttributeError):
            return VendorImage.objects.none()
        
        return VendorImage.objects.filter(vendor=vendor)
    
    def perform_update(self, serializer):
        """Update image, handling preview selection."""
        # Get the is_preview value from the request data before saving
        is_preview = serializer.validated_data.get('is_preview', False)
        
        # Get the instance before saving
        instance = self.get_object()
        
        # If setting as preview, unset others FIRST to avoid unique constraint violation
        if is_preview:
            # Unset all other preview images for this vendor BEFORE saving
            VendorImage.objects.filter(
                vendor=instance.vendor,
                is_preview=True
            ).exclude(id=instance.id).update(is_preview=False)
        
        # Now save the instance with the updated is_preview value
        instance = serializer.save()
        
        return instance
    
    def perform_destroy(self, instance):
        """Delete image file and record."""
        if instance.image:
            instance.image.delete(save=False)
        instance.delete()