from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .views import (
    LoginView, LogoutView, RegisterView, UserView,
    VerifyOTPView, OAuthInitiateView, OAuthCallbackView
)

urlpatterns = [
    # JWT token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Custom auth endpoints (using JWT)
    path('login/', LoginView.as_view(), name='auth_login'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('user/', UserView.as_view(), name='auth_user'),
    
    # 2FA endpoints
    path('verify-otp/', VerifyOTPView.as_view(), name='auth_verify_otp'),
    
    # OAuth endpoints - callback must come BEFORE the parameterized route
    path('oauth/callback/', OAuthCallbackView.as_view(), name='auth_oauth_callback'),
    path('oauth/<str:provider>/', OAuthInitiateView.as_view(), name='auth_oauth_initiate'),
]
