from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from .views import (
    LoginView, LogoutView, RegisterView, UserView,
    VerifyOTPView, OAuthInitiateView, OAuthCallbackView,
    ProfileUpdateView, ProfilePictureUploadView,
    CustomerAddressListView, CustomerAddressDetailView, SetDefaultAddressView,
    FavoriteVendorListView, FavoriteVendorDeleteView,
    FavoriteProductServiceListView, FavoriteProductServiceDeleteView
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
    
    # Profile endpoints
    path('profile/update/', ProfileUpdateView.as_view(), name='profile_update'),
    path('profile/picture/', ProfilePictureUploadView.as_view(), name='profile_picture_upload'),
    
    # Customer addresses
    path('customers/addresses/', CustomerAddressListView.as_view(), name='customer-addresses-list'),
    path('customers/addresses/<int:pk>/', CustomerAddressDetailView.as_view(), name='customer-address-detail'),
    path('customers/addresses/<int:pk>/set-default/', SetDefaultAddressView.as_view(), name='customer-address-set-default'),
    
    # Customer favorites
    path('customers/favorites/', FavoriteVendorListView.as_view(), name='customer-favorites-list'),
    path('customers/favorites/<int:vendor_id>/', FavoriteVendorDeleteView.as_view(), name='customer-favorite-delete'),
    path('customers/favorites/products/', FavoriteProductServiceListView.as_view(), name='customer-favorite-products-list'),
    path('customers/favorites/products/<int:product_service_id>/', FavoriteProductServiceDeleteView.as_view(), name='customer-favorite-product-delete'),
]
