from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from django.contrib.auth.models import User
from .serializers import UserSerializer, UserRegistrationSerializer, LoginSerializer, OTPVerificationSerializer, ProfileUpdateSerializer
from .utils import generate_otp_for_user, send_otp_email
from .models import OTPVerification, UserProfile, OAuthAccount


class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        # Authenticate using email
        user = authenticate(request, email=email, password=password)
        
        if not user:
            return Response(
                {'error': 'Invalid email or password'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Check if user has 2FA enabled
        try:
            profile = user.profile
            has_2fa = profile.two_factor_enabled
        except UserProfile.DoesNotExist:
            has_2fa = False
        
        if has_2fa:
            # Generate OTP and send email
            otp_code, session_token, otp_verification = generate_otp_for_user(user)
            send_otp_email(user, otp_code)
            
            return Response({
                'requires_2fa': True,
                'session_token': session_token,
                'message': 'OTP has been sent to your email'
            }, status=status.HTTP_200_OK)
        else:
            # Normal login without 2FA
            login(request, user)
            refresh = RefreshToken.for_user(user)
            
            # Prefetch related objects for user data
            user = User.objects.prefetch_related(
                'profile__primary_address__country',
                'profile__primary_language',
                'customer_profile',
                'documents'
            ).get(pk=user.pk)
            
            return Response({
                'user': UserSerializer(user, context={'request': request}).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'requires_2fa': False
            })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Try to blacklist the refresh token if provided
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
        except Exception:
            # If blacklist fails, just continue (token will expire naturally)
            pass
        
        logout(request)
        return Response({'message': 'Successfully logged out'})


class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyOTPView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp_code = serializer.validated_data['otp_code']
        session_token = serializer.validated_data['session_token']
        
        try:
            otp_verification = OTPVerification.objects.get(
                session_token=session_token,
                is_used=False
            )
        except OTPVerification.DoesNotExist:
            return Response(
                {'error': 'Invalid or expired session token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify OTP
        if not otp_verification.verify_otp(otp_code):
            return Response(
                {'error': 'Invalid or expired OTP code'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mark OTP as used
        otp_verification.mark_as_used()
        
        # Complete login
        user = otp_verification.user
        login(request, user, backend='auth_api.backends.EmailAuthenticationBackend')
        refresh = RefreshToken.for_user(user)
        
        # Prefetch related objects for user data
        user = User.objects.prefetch_related(
            'profile__primary_address__country',
            'profile__primary_language',
            'customer_profile',
            'documents'
        ).get(pk=user.pk)
        
        return Response({
            'user': UserSerializer(user, context={'request': request}).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        })


class OAuthInitiateView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request, provider):
        """
        Initiate OAuth flow by redirecting to provider.
        For now, return the OAuth URL that frontend should redirect to.
        """
        from django.conf import settings
        from urllib.parse import urlencode
        
        if provider not in ['google', 'facebook']:
            return Response(
                {'error': 'Invalid provider. Supported: google, facebook'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get OAuth credentials from settings
        if provider == 'google':
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
            if not client_id:
                return Response(
                    {'error': 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in your .env file and restart the server.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            redirect_uri = request.build_absolute_uri('/api/auth/oauth/callback/')
            scope = 'openid email profile'
            auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode({
                'client_id': client_id,
                'redirect_uri': redirect_uri,
                'response_type': 'code',
                'scope': scope,
                'state': provider
            })}"
        elif provider == 'facebook':
            app_id = getattr(settings, 'FACEBOOK_APP_ID', None)
            if not app_id:
                return Response(
                    {'error': 'Facebook OAuth is not configured. Please set FACEBOOK_APP_ID in your .env file and restart the server.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            redirect_uri = request.build_absolute_uri('/api/auth/oauth/callback/')
            auth_url = f"https://www.facebook.com/v18.0/dialog/oauth?{urlencode({
                'client_id': app_id,
                'redirect_uri': redirect_uri,
                'state': provider,
                'scope': 'email'
            })}"
        
        return Response({
            'auth_url': auth_url,
            'provider': provider
        })


class OAuthCallbackView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Handle OAuth callback from provider.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Debug: Log all GET parameters
        logger.info(f"OAuth callback received. GET params: {dict(request.GET)}")
        
        # Print to console for immediate visibility
        print("=" * 80)
        print("OAUTH CALLBACK - GET params:", dict(request.GET))
        print("=" * 80)
        
        # Django QueryDict can return lists, so use getlist
        code = request.GET.get('code')
        state_list = request.GET.getlist('state')
        state = state_list[0] if state_list else request.GET.get('state', '')
        error = request.GET.get('error')
        
        print(f"Code: {bool(code)}, State list: {state_list}, State: '{state}', Error: {error}")
        
        # Debug logging
        logger.info(f"OAuth callback - code: {bool(code)}, state_list: {state_list}, state: '{state}', error: {error}")
        
        if error:
            return Response(
                {'error': f'OAuth error: {error}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not code or not state:
            return Response(
                {'error': f'Missing code or state parameter. Code: {bool(code)}, State: "{state}"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Normalize state: ensure it's a string, strip whitespace and convert to lowercase
        if not state:
            return Response(
                {'error': 'State parameter is empty', 'debug': {'state_list': state_list, 'all_params': dict(request.GET)}},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        provider = str(state).strip().lower()
        print(f"Normalized provider: '{provider}' (from state: '{state}')")
        
        # Debug: Return detailed info in error message
        if provider not in ['google', 'facebook']:
            # Return detailed debug info
            debug_info = {
                'error': 'Invalid provider',
                'received_state': str(state),
                'normalized_provider': provider,
                'state_type': str(type(state)),
                'state_repr': repr(state),
                'state_list': state_list,
                'all_get_params': dict(request.GET),
                'supported_providers': ['google', 'facebook']
            }
            print(f"INVALID PROVIDER DEBUG: {debug_info}")
            logger.error(f"Invalid provider: {debug_info}")
            return Response(debug_info, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Provider validated successfully: {provider}")
        
        # Exchange code for access token and get user info
        try:
            user_email, provider_user_id, picture_url = self._get_user_info_from_provider(provider, code, request)
        except Exception as e:
            logger.error(f"Error getting user info from provider: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Failed to authenticate with {provider}: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user_email:
            return Response(
                {'error': 'Failed to get user information from provider'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OAuth account exists
        try:
            oauth_account = OAuthAccount.objects.get(
                provider=provider,
                provider_user_id=provider_user_id
            )
            user = oauth_account.user
            # Update OAuth picture URL if provided
            if picture_url:
                from .models import UserDocument
                # Get or create profile picture document
                profile_picture, created = UserDocument.objects.get_or_create(
                    user=user,
                    document_type='profile_picture',
                    defaults={
                        'file_name': f'{provider}_profile_picture.jpg',
                        'external_url': picture_url,
                        'mime_type': 'image/jpeg',
                    }
                )
                if not created:
                    # Update existing profile picture
                    profile_picture.external_url = picture_url
                    profile_picture.save()
        except OAuthAccount.DoesNotExist:
            # Check if user with this email exists
            try:
                user = User.objects.get(email=user_email)
                # Link OAuth account to existing user
                OAuthAccount.objects.create(
                    user=user,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    email=user_email
                )
                # Create profile picture document if OAuth picture provided
                if picture_url:
                    from .models import UserDocument
                    UserDocument.objects.get_or_create(
                        user=user,
                        document_type='profile_picture',
                        defaults={
                            'file_name': f'{provider}_profile_picture.jpg',
                            'external_url': picture_url,
                            'mime_type': 'image/jpeg',
                        }
                    )
            except User.DoesNotExist:
                # Create new user
                user = User.objects.create_user(
                    username=user_email,
                    email=user_email
                )
                # Create OAuth account
                OAuthAccount.objects.create(
                    user=user,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    email=user_email
                )
                # Create profile and permissions
                from .utils import set_default_customer_permissions
                from .models import Customer, UserProfile, UserDocument
                Customer.objects.create(user=user, display_name=user_email.split('@')[0])
                UserProfile.objects.create(user=user)
                # Create profile picture document if OAuth picture provided
                if picture_url:
                    UserDocument.objects.create(
                        user=user,
                        document_type='profile_picture',
                        file_name=f'{provider}_profile_picture.jpg',
                        external_url=picture_url,
                        mime_type='image/jpeg',
                    )
                set_default_customer_permissions(user)
        
        # Generate JWT tokens
        # Specify backend when multiple backends are configured
        login(request, user, backend='auth_api.backends.EmailAuthenticationBackend')
        refresh = RefreshToken.for_user(user)
        
        # Prefetch related objects for user data
        user = User.objects.prefetch_related(
            'profile__primary_address__country',
            'profile__primary_language',
            'customer_profile',
            'documents'
        ).get(pk=user.pk)
        
        # Redirect to frontend with tokens
        from django.conf import settings
        from urllib.parse import urlencode
        import base64
        import json
        
        # Get frontend URL from settings or use default
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')
        
        # Create token data
        token_data = {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user, context={'request': request}).data
        }
        
        # Encode tokens as base64 for URL (or use hash fragment)
        # Using hash fragment is more secure as it's not sent to server
        tokens_json = json.dumps(token_data)
        tokens_encoded = base64.urlsafe_b64encode(tokens_json.encode()).decode()
        
        # Redirect to frontend with tokens in hash
        redirect_url = f"{frontend_url}/oauth/callback#{tokens_encoded}"
        
        from django.shortcuts import redirect
        return redirect(redirect_url)
    
    def _get_user_info_from_provider(self, provider, code, request):
        """
        Exchange OAuth code for access token and get user info.
        Returns (email, provider_user_id, picture_url)
        """
        import requests
        import logging
        from django.conf import settings
        
        logger = logging.getLogger(__name__)
        redirect_uri = request.build_absolute_uri('/api/auth/oauth/callback/')
        
        if provider == 'google':
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
            client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', None)
            
            if not client_id or not client_secret:
                logger.error(f"Google OAuth credentials missing. Client ID: {bool(client_id)}, Secret: {bool(client_secret)}")
                return None, None, None
            
            # Exchange code for token
            token_response = requests.post('https://oauth2.googleapis.com/token', data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code'
            })
            
            if token_response.status_code != 200:
                logger.error(f"Google token exchange failed. Status: {token_response.status_code}, Response: {token_response.text}")
                return None, None, None
            
            access_token = token_response.json().get('access_token')
            
            # Get user info
            user_info_response = requests.get(
                'https://www.googleapis.com/oauth2/v2/userinfo',
                headers={'Authorization': f'Bearer {access_token}'}
            )
            
            if user_info_response.status_code != 200:
                return None, None, None
            
            user_info = user_info_response.json()
            picture_url = user_info.get('picture')  # Google provides 'picture' field
            return user_info.get('email'), user_info.get('id'), picture_url
        
        elif provider == 'facebook':
            app_id = getattr(settings, 'FACEBOOK_APP_ID', None)
            app_secret = getattr(settings, 'FACEBOOK_APP_SECRET', None)
            
            # Exchange code for token
            token_response = requests.get('https://graph.facebook.com/v18.0/oauth/access_token', params={
                'client_id': app_id,
                'client_secret': app_secret,
                'redirect_uri': redirect_uri,
                'code': code
            })
            
            if token_response.status_code != 200:
                return None, None, None
            
            access_token = token_response.json().get('access_token')
            
            # Get user info including picture
            user_info_response = requests.get(
                'https://graph.facebook.com/v18.0/me',
                params={
                    'fields': 'id,email,picture',
                    'access_token': access_token
                }
            )
            
            if user_info_response.status_code != 200:
                return None, None, None
            
            user_info = user_info_response.json()
            # Facebook returns picture as an object with 'data' containing 'url'
            picture_data = user_info.get('picture', {})
            picture_url = picture_data.get('data', {}).get('url') if isinstance(picture_data, dict) else None
            return user_info.get('email'), user_info.get('id'), picture_url
        
        return None, None, None


class UserView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        # Prefetch related objects to avoid N+1 queries
        from django.db.models import Prefetch
        from .models import UserProfile, Customer
        
        user = request.user
        # Ensure profile exists
        UserProfile.objects.get_or_create(user=user)
        
        # Prefetch related objects
        user = User.objects.prefetch_related(
            'profile__primary_address__country',
            'profile__primary_language',
            'customer_profile',
            'documents'
        ).get(pk=user.pk)
        
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        """
        Update user profile information.
        
        Supports partial updates (PATCH) for:
        - User fields: email, first_name, last_name
        - UserProfile fields: phone_number, country, primary_language
        - Customer fields: display_name
        """
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_user = serializer.update(request.user, serializer.validated_data)
            # Refresh user with prefetched relationships to include updated profile data
            from django.db.models import Prefetch
            from .models import UserProfile, Customer
            
            # Ensure profile exists
            UserProfile.objects.get_or_create(user=updated_user)
            
            # Prefetch related objects
            updated_user = User.objects.prefetch_related(
                'profile__primary_address__country',
                'profile__primary_language',
                'customer_profile',
                'documents'
            ).get(pk=updated_user.pk)
            
            serializer = UserSerializer(updated_user, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
        except ValidationError as e:
            # Handle validation errors from update method
            return Response(
                e.detail if hasattr(e, 'detail') else {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to update profile: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ProfilePictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Upload or update user profile picture.
        Accepts multipart/form-data with 'file' field.
        """
        from .models import UserDocument
        import os
        from django.core.files.images import get_image_dimensions
        
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
            # Get or create profile picture document
            profile_picture, created = UserDocument.objects.get_or_create(
                user=request.user,
                document_type='profile_picture',
                defaults={
                    'file_name': uploaded_file.name,
                    'mime_type': uploaded_file.content_type,
                }
            )
            
            # If updating existing, delete old file if it exists
            if not created and profile_picture.file:
                profile_picture.file.delete(save=False)
            
            # Save new file
            profile_picture.file = uploaded_file
            profile_picture.file_name = uploaded_file.name
            profile_picture.mime_type = uploaded_file.content_type
            profile_picture.external_url = None  # Clear OAuth URL when user uploads their own
            profile_picture.save()
            
            # Return updated user data
            from django.db.models import Prefetch
            from .models import UserProfile, Customer
            
            user = User.objects.prefetch_related(
                'profile__country',
                'profile__primary_language',
                'customer_profile',
                'documents'
            ).get(pk=request.user.pk)
            
            serializer = UserSerializer(user, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to upload profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def delete(self, request):
        """
        Delete user profile picture.
        """
        from .models import UserDocument
        
        try:
            profile_picture = UserDocument.objects.filter(
                user=request.user,
                document_type='profile_picture'
            ).first()
            
            if profile_picture:
                # Delete file if it exists
                if profile_picture.file:
                    profile_picture.file.delete(save=False)
                profile_picture.delete()
            
            # Return updated user data
            from django.db.models import Prefetch
            from .models import UserProfile, Customer
            
            user = User.objects.prefetch_related(
                'profile__country',
                'profile__primary_language',
                'customer_profile',
                'documents'
            ).get(pk=request.user.pk)
            
            serializer = UserSerializer(user, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to delete profile picture: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
