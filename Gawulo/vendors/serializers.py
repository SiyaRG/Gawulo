from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vendor, MenuItem, MenuCategory, VendorReview


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class MenuCategorySerializer(serializers.ModelSerializer):
    """Serializer for MenuCategory model."""
    
    class Meta:
        model = MenuCategory
        fields = ['id', 'name', 'description', 'is_active', 'sort_order']


class MenuItemSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem model."""
    category = MenuCategorySerializer(read_only=True)
    vendor_name = serializers.CharField(source='vendor.business_name', read_only=True)
    
    class Meta:
        model = MenuItem
        fields = [
            'id', 'vendor', 'vendor_name', 'category', 'name', 'description',
            'price', 'original_price', 'availability_status', 'is_featured',
            'image', 'preparation_time', 'allergens', 'dietary_info',
            'offline_available', 'last_updated', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_updated', 'created_at', 'updated_at']


class VendorReviewSerializer(serializers.ModelSerializer):
    """Serializer for VendorReview model."""
    customer_name = serializers.CharField(source='customer.username', read_only=True)
    
    class Meta:
        model = VendorReview
        fields = [
            'id', 'vendor', 'customer', 'customer_name', 'rating', 'comment',
            'is_verified_purchase', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model."""
    user = UserSerializer(read_only=True)
    menu_items = MenuItemSerializer(many=True, read_only=True)
    reviews = VendorReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'business_name', 'business_type', 'description',
            'phone_number', 'email', 'address', 'latitude', 'longitude',
            'operating_hours', 'delivery_radius', 'minimum_order', 'delivery_fee',
            'status', 'is_verified', 'rating', 'total_orders', 'offline_capable',
            'last_sync', 'sync_status', 'created_at', 'updated_at',
            'menu_items', 'reviews', 'average_rating'
        ]
        read_only_fields = [
            'id', 'rating', 'total_orders', 'last_sync', 'sync_status',
            'created_at', 'updated_at', 'menu_items', 'reviews', 'average_rating'
        ]
    
    def get_average_rating(self, obj):
        """Calculate average rating from reviews."""
        return obj.get_average_rating()


class VendorRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for vendor registration."""
    user = UserSerializer(read_only=True)
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'business_name', 'business_type', 'description',
            'phone_number', 'email', 'address', 'latitude', 'longitude',
            'operating_hours', 'delivery_radius', 'minimum_order', 'delivery_fee',
            'password', 'confirm_password'
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
        
        # Create user account
        user = User.objects.create_user(
            username=validated_data.get('business_name', '').lower().replace(' ', '_'),
            email=validated_data.get('email', ''),
            password=password
        )
        
        # Create vendor profile
        vendor = Vendor.objects.create(user=user, **validated_data)
        return vendor
