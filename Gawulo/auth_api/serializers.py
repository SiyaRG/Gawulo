"""
Serializers for authentication API.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Customer, UserProfile, FavoriteVendor, FavoriteProductService, Address


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with profile information."""
    
    phone_number = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()
    primary_language = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    address_line1 = serializers.SerializerMethodField()
    address_line2 = serializers.SerializerMethodField()
    address_city = serializers.SerializerMethodField()
    address_state_province = serializers.SerializerMethodField()
    address_postal_code = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 
                  'phone_number', 'country', 'primary_language', 'display_name', 'profile_picture',
                  'address_line1', 'address_line2', 'address_city', 'address_state_province', 'address_postal_code')
        read_only_fields = ('id', 'is_staff', 'username')
    
    def get_phone_number(self, obj):
        """Get phone number from user profile."""
        try:
            return obj.profile.phone_number or ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_country(self, obj):
        """Get country ISO code from primary address."""
        try:
            if obj.profile.primary_address and obj.profile.primary_address.country:
                return obj.profile.primary_address.country.iso_alpha2
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_primary_language(self, obj):
        """Get primary language ISO code from user profile."""
        try:
            if obj.profile.primary_language:
                return obj.profile.primary_language.iso_639_1
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_display_name(self, obj):
        """Get display name from customer profile."""
        try:
            return obj.customer_profile.display_name or ''
        except (Customer.DoesNotExist, AttributeError):
            return obj.username or ''
    
    def get_profile_picture(self, obj):
        """Get profile picture URL from UserDocument.
        Priority: uploaded file > OAuth external URL > None
        Uses prefetched documents if available, otherwise queries.
        """
        try:
            from .models import UserDocument
            
            # Try to use prefetched documents first (more efficient)
            if hasattr(obj, 'documents'):
                profile_picture = None
                for doc in obj.documents.all():
                    if doc.document_type == 'profile_picture':
                        profile_picture = doc
                        break
            else:
                # Fallback to query if not prefetched
                profile_picture = UserDocument.objects.filter(
                    user=obj,
                    document_type='profile_picture'
                ).first()
            
            if profile_picture:
                # If there's an uploaded file, return its URL
                if profile_picture.file:
                    request = self.context.get('request')
                    if request:
                        return request.build_absolute_uri(profile_picture.file.url)
                    # Fallback to relative URL if no request context
                    return profile_picture.file.url
                # Otherwise, return the external URL (OAuth picture)
                elif profile_picture.external_url:
                    return profile_picture.external_url
            return None
        except Exception:
            return None
    
    def get_address_line1(self, obj):
        """Get address line 1 from primary address."""
        try:
            if obj.profile.primary_address:
                return obj.profile.primary_address.line1 or ''
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_address_line2(self, obj):
        """Get address line 2 from primary address."""
        try:
            if obj.profile.primary_address:
                return obj.profile.primary_address.line2 or ''
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_address_city(self, obj):
        """Get city from primary address."""
        try:
            if obj.profile.primary_address:
                return obj.profile.primary_address.city or ''
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_address_state_province(self, obj):
        """Get state/province from primary address."""
        try:
            if obj.profile.primary_address:
                return obj.profile.primary_address.state_province or ''
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''
    
    def get_address_postal_code(self, obj):
        """Get postal code from primary address."""
        try:
            if obj.profile.primary_address:
                return obj.profile.primary_address.postal_code or ''
            return ''
        except (UserProfile.DoesNotExist, AttributeError):
            return ''


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )


class OTPVerificationSerializer(serializers.Serializer):
    """Serializer for OTP verification."""
    
    otp_code = serializers.CharField(
        max_length=6,
        min_length=6,
        required=True,
        help_text="6-digit OTP code"
    )
    session_token = serializers.CharField(
        required=True,
        help_text="Session token from login response"
    )


class UserRegistrationSerializer(serializers.Serializer):
    """Serializer for user registration with validation."""
    
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
    
    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        if User.objects.filter(username=value).exists():
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
        email = validated_data['email']
        password = validated_data['password']
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')
        display_name = validated_data.get('display_name', email.split('@')[0])
        phone_number = validated_data.get('phone_number', '').strip() or None
        country_code = validated_data.get('country', '').strip().upper() or None
        language_code = validated_data.get('primary_language', '').strip().lower() or None
        
        # Create user with email as username
        user = User.objects.create_user(
            username=email,  # Use email as username
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
        
        # Create UserProfile
        profile = UserProfile.objects.create(
            user=user,
            **profile_data
        )
        
        # Create primary address with country if provided
        if country_code:
            try:
                from lookups.models import Country
                from .models import Address
                country = Country.objects.get(iso_alpha2=country_code, is_active=True)
                primary_address = Address.objects.create(
                    user=user,
                    address_type='residential',
                    line1='',
                    city='',
                    postal_code='',
                    country=country
                )
                profile.primary_address = primary_address
                profile.save()  # Save to update primary_address and auto-populate country_code
            except Exception:
                # Country not found or inactive - skip it
                pass
        
        # Set default customer permissions
        set_default_customer_permissions(user)
        
        return user


class ProfileUpdateSerializer(serializers.Serializer):
    """Serializer for updating user profile information."""
    
    email = serializers.EmailField(required=False, allow_blank=False)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    display_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    country = serializers.CharField(max_length=2, required=False, allow_blank=True, help_text="ISO 3166-1 alpha-2 country code (e.g., US, ZA)")
    primary_language = serializers.CharField(max_length=2, required=False, allow_blank=True, help_text="ISO 639-1 language code (e.g., en, es)")
    # Primary address fields
    address_line1 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    address_line2 = serializers.CharField(max_length=255, required=False, allow_blank=True)
    address_city = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address_state_province = serializers.CharField(max_length=100, required=False, allow_blank=True)
    address_postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    def validate_email(self, value):
        """Validate that email is unique if provided."""
        if value:
            # Check if email is being changed and if it's already taken by another user
            # We'll check this in the update method where we have access to the user instance
            return value
        return value
    
    def validate_country(self, value):
        """Validate country code if provided."""
        if value:
            value = value.strip().upper()
            try:
                from lookups.models import Country
                country = Country.objects.get(iso_alpha2=value, is_active=True)
                return value
            except Country.DoesNotExist:
                raise serializers.ValidationError(f"Invalid country code: {value}")
        return value
    
    def validate_primary_language(self, value):
        """Validate language code if provided."""
        if value:
            value = value.strip().lower()
            try:
                from lookups.models import Language
                language = Language.objects.get(iso_639_1=value, is_active=True)
                return value
            except Language.DoesNotExist:
                raise serializers.ValidationError(f"Invalid language code: {value}")
        return value
    
    def update(self, instance, validated_data):
        """
        Update user, user profile, and customer profile.
        
        Args:
            instance: User instance to update
            validated_data: Validated data from serializer
        
        Returns:
            Updated User instance
        """
        # Update User model fields
        if 'email' in validated_data:
            email = validated_data['email']
            # Check if email is being changed and if it's already taken
            if email != instance.email:
                if User.objects.filter(email=email).exclude(pk=instance.pk).exists():
                    raise serializers.ValidationError({"email": "A user with that email already exists."})
            instance.email = email
        
        if 'first_name' in validated_data:
            instance.first_name = validated_data['first_name']
        
        if 'last_name' in validated_data:
            instance.last_name = validated_data['last_name']
        
        instance.save()
        
        # Get or create UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=instance)
        
        # Update UserProfile fields
        if 'phone_number' in validated_data:
            phone_number = validated_data['phone_number']
            if phone_number:
                phone_number = phone_number.strip()
                profile.phone_number = phone_number if phone_number else None
            else:
                profile.phone_number = None
        
        # Handle address and country updates
        from .models import Address
        from lookups.models import Country
        
        # Get or create primary address
        primary_address = profile.primary_address
        address_needs_update = False
        
        # Update country in primary address
        if 'country' in validated_data:
            country_code = validated_data.get('country', '').strip() if validated_data.get('country') else ''
            if country_code:
                try:
                    country = Country.objects.get(iso_alpha2=country_code.upper(), is_active=True)
                    # Create primary address if it doesn't exist
                    if not primary_address:
                        primary_address = Address.objects.create(
                            user=instance,
                            address_type='residential',
                            line1='',
                            city='',
                            postal_code='',
                            country=country
                        )
                        profile.primary_address = primary_address
                        address_needs_update = True
                    elif primary_address.country != country:
                        primary_address.country = country
                        address_needs_update = True
                except Country.DoesNotExist:
                    # Should not happen due to validation, but handle gracefully
                    pass
            elif primary_address:
                # Clear country if empty string or None
                primary_address.country = None
                address_needs_update = True
        
        # Update other address fields
        address_fields = {
            'address_line1': 'line1',
            'address_line2': 'line2',
            'address_city': 'city',
            'address_state_province': 'state_province',
            'address_postal_code': 'postal_code',
        }
        
        for serializer_field, model_field in address_fields.items():
            if serializer_field in validated_data:
                value = validated_data[serializer_field].strip() if validated_data[serializer_field] else ''
                # Create primary address if it doesn't exist and we have address data
                if not primary_address and value:
                    primary_address = Address.objects.create(
                        user=instance,
                        address_type='residential',
                        line1='',
                        city='',
                        postal_code='',
                    )
                    profile.primary_address = primary_address
                    address_needs_update = True
                
                if primary_address:
                    setattr(primary_address, model_field, value)
                    address_needs_update = True
        
        # Save address if it was updated
        if address_needs_update and primary_address:
            primary_address.save()
            profile.save()  # Save profile to update primary_address reference
        
        if 'primary_language' in validated_data:
            language_code = validated_data.get('primary_language', '').strip() if validated_data.get('primary_language') else ''
            if language_code:
                from lookups.models import Language
                try:
                    language = Language.objects.get(iso_639_1=language_code.lower(), is_active=True)
                    profile.primary_language = language
                except Language.DoesNotExist:
                    # Should not happen due to validation, but handle gracefully
                    pass
            else:
                # Clear language if empty string or None
                profile.primary_language = None
        
        profile.save()
        
        # Update Customer profile if it exists
        if 'display_name' in validated_data:
            try:
                customer = instance.customer_profile
                customer.display_name = validated_data['display_name']
                customer.save()
            except Customer.DoesNotExist:
                # Create customer profile if it doesn't exist
                Customer.objects.create(
                    user=instance,
                    display_name=validated_data['display_name']
                )
        
        return instance


class AddressSerializer(serializers.ModelSerializer):
    """Serializer for Address model."""
    
    country_name = serializers.CharField(source='country.country_name', read_only=True)
    country_code = serializers.CharField(source='country.iso_alpha2', read_only=True)
    country = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    class Meta:
        model = Address
        fields = [
            'id', 'user', 'address_type', 'line1', 'line2', 'city',
            'state_province', 'postal_code', 'country', 'country_name',
            'country_code', 'is_default', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def validate_country(self, value):
        """Validate and convert country iso_alpha2 to Country instance."""
        if not value or value == '':
            return None
        
        try:
            from lookups.models import Country
            country = Country.objects.get(iso_alpha2=value.upper(), is_active=True)
            return country
        except Country.DoesNotExist:
            raise serializers.ValidationError(f"Invalid country code: {value}")
    
    def validate(self, data):
        """Ensure only one default address per user."""
        if data.get('is_default', False):
            user = data.get('user') or (self.instance.user if self.instance else None)
            if user:
                # Unset other default addresses for this user
                Address.objects.filter(user=user, is_default=True).exclude(
                    id=self.instance.id if self.instance else None
                ).update(is_default=False)
        return data


class FavoriteVendorSerializer(serializers.ModelSerializer):
    """Serializer for FavoriteVendor model."""
    
    vendor = serializers.SerializerMethodField()
    
    class Meta:
        model = FavoriteVendor
        fields = ['id', 'customer', 'vendor', 'created_at']
        read_only_fields = ['id', 'customer', 'created_at']
    
    def get_vendor(self, obj):
        """Get vendor data using VendorSerializer."""
        from vendors.serializers import VendorSerializer
        request = self.context.get('request')
        return VendorSerializer(obj.vendor, context={'request': request}).data


class FavoriteProductServiceSerializer(serializers.ModelSerializer):
    """Serializer for FavoriteProductService model."""
    
    product_service = serializers.SerializerMethodField()
    
    class Meta:
        model = FavoriteProductService
        fields = ['id', 'customer', 'product_service', 'created_at']
        read_only_fields = ['id', 'customer', 'created_at']
    
    def get_product_service(self, obj):
        """Get product service data using ProductServiceSerializer."""
        from vendors.serializers import ProductServiceSerializer
        request = self.context.get('request')
        return ProductServiceSerializer(obj.product_service, context={'request': request}).data
