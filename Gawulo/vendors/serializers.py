from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vendor, ProductService, ProductImage, VendorImage


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model."""
    
    class Meta:
        model = ProductImage
        fields = ['id', 'product_service', 'image', 'is_preview', 'display_order', 'created_at']
        read_only_fields = ['id', 'product_service', 'created_at']
    
    def validate(self, data):
        """Validate preview image selection."""
        # Validation is handled in the view's perform_update method
        return data


class VendorImageSerializer(serializers.ModelSerializer):
    """Serializer for VendorImage model."""
    
    class Meta:
        model = VendorImage
        fields = ['id', 'vendor', 'image', 'is_preview', 'display_order', 'created_at']
        read_only_fields = ['id', 'vendor', 'created_at']
    
    def validate(self, data):
        """Validate preview image selection."""
        # Validation is handled in the view's perform_update method
        return data


class ProductServiceSerializer(serializers.ModelSerializer):
    """Serializer for ProductService model."""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    preview_image = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductService
        fields = [
            'id', 'vendor', 'vendor_name', 'name', 'description',
            'current_price', 'image', 'images', 'preview_image', 'is_service',
            'available_for', 'estimated_preparation_time_minutes', 'created_at'
        ]
        read_only_fields = ['id', 'vendor', 'created_at']
    
    def get_preview_image(self, obj):
        """Return the preview image URL or first image if no preview set."""
        preview = obj.images.filter(is_preview=True).first()
        if preview:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(preview.image.url)
            return preview.image.url
        # Fallback to first image or legacy image field
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model."""
    user = UserSerializer(read_only=True)
    products_services = ProductServiceSerializer(many=True, read_only=True)
    images = VendorImageSerializer(many=True, read_only=True)
    preview_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'name', 'category', 'profile_description',
            'profile_image', 'images', 'preview_image', 'is_verified', 'average_rating', 'review_count',
            'created_at', 'updated_at', 'products_services'
        ]
        read_only_fields = [
            'id', 'user', 'is_verified', 'average_rating', 'review_count',
            'created_at', 'updated_at', 'products_services'
        ]
    
    def get_preview_image(self, obj):
        """Return the preview image URL or first image if no preview set."""
        preview = obj.images.filter(is_preview=True).first()
        if preview:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(preview.image.url)
            return preview.image.url
        # Fallback to first image or legacy profile_image field
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        if obj.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_image.url)
            return obj.profile_image.url
        return None


class VendorRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for vendor registration."""
    user = UserSerializer(read_only=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'name', 'category', 'profile_description',
            'username', 'email', 'password', 'confirm_password'
        ]
        read_only_fields = ['id', 'user']
    
    def validate(self, data):
        """Validate password confirmation."""
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords don't match.")
        return data
    
    def create(self, validated_data):
        """Create a new vendor with user account."""
        password = validated_data.pop('password')
        confirm_password = validated_data.pop('confirm_password')
        username = validated_data.pop('username')
        email = validated_data.pop('email')
        
        # Create user account
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Create vendor profile
        vendor = Vendor.objects.create(user=user, **validated_data)
        return vendor
