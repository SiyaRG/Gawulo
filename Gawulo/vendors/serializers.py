from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Vendor, ProductService


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class ProductServiceSerializer(serializers.ModelSerializer):
    """Serializer for ProductService model."""
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    
    class Meta:
        model = ProductService
        fields = [
            'id', 'vendor', 'vendor_name', 'name', 'description',
            'current_price', 'is_service', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor model."""
    user = UserSerializer(read_only=True)
    products_services = ProductServiceSerializer(many=True, read_only=True, source='products_services')
    
    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'name', 'category', 'profile_description',
            'is_verified', 'average_rating', 'review_count',
            'created_at', 'updated_at', 'products_services'
        ]
        read_only_fields = [
            'id', 'average_rating', 'review_count',
            'created_at', 'updated_at', 'products_services'
        ]


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
