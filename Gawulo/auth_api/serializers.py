"""
Serializers for authentication API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Customer, UserProfile


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')
        read_only_fields = ('id', 'is_staff')


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration with validation."""
    
    username = serializers.CharField(
        max_length=150,
        required=True,
        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only."
    )
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    country = serializers.CharField(max_length=2, required=False, allow_blank=True, help_text="ISO 3166-1 alpha-2 country code (e.g., US, ZA)")
    primary_language = serializers.CharField(max_length=2, required=False, allow_blank=True, help_text="ISO 639-1 language code (e.g., en, es)")
    
    def validate_username(self, value):
        """Validate that username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value
    
    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value
    
    def validate(self, attrs):
        """Validate that passwords match."""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        """Create a new user with customer profile, user profile, and permissions."""
        from .utils import set_default_customer_permissions
        
        # Extract fields
        username = validated_data['username']
        email = validated_data['email']
        password = validated_data['password']
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        display_name = validated_data.get('display_name', username)
        phone_number = validated_data.get('phone_number', '').strip() or None
        country_code = validated_data.get('country', '').strip().upper() or None
        language_code = validated_data.get('primary_language', '').strip().lower() or None
        
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create customer profile
        Customer.objects.create(
            user=user,
            display_name=display_name
        )
        
        # Create user profile
        profile_data = {}
        if phone_number:
            profile_data['phone_number'] = phone_number
        
        # Lookup country if provided
        country = None
        if country_code:
            try:
                from lookups.models import Country
                country = Country.objects.get(iso_alpha2=country_code, is_active=True)
                profile_data['country'] = country
            except Exception:
                # Country not found or inactive - skip it
                pass
        
        # Lookup language if provided
        primary_language = None
        if language_code:
            try:
                from lookups.models import Language
                primary_language = Language.objects.get(iso_639_1=language_code, is_active=True)
                profile_data['primary_language'] = primary_language
            except Exception:
                # Language not found or inactive - skip it
                pass
        
        # Create UserProfile (country_code will be auto-populated by save() method if country is set)
        UserProfile.objects.create(
            user=user,
            **profile_data
        )
        
        # Set default customer permissions
        set_default_customer_permissions(user)
        
        return user

