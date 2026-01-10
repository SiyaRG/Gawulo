from django.urls import path
from . import views

app_name = 'vendors'

urlpatterns = [
    path('', views.VendorListView.as_view(), name='vendor-list'),
    path('<int:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),
    path('register/', views.VendorRegistrationView.as_view(), name='vendor-register'),
    path('<int:pk>/products-services/', views.VendorProductsServicesView.as_view(), name='vendor-products-services'),
    path('<int:pk>/reviews/', views.VendorReviewsView.as_view(), name='vendor-reviews'),
    path('products-services/', views.ProductServiceListView.as_view(), name='product-service-list'),
    path('products-services/<int:pk>/', views.ProductServiceDetailView.as_view(), name='product-service-detail'),
    path('products-services/create/', views.ProductServiceCreateView.as_view(), name='product-service-create'),
    path('products-services/<int:pk>/update/', views.ProductServiceUpdateView.as_view(), name='product-service-update'),
    path('products-services/<int:pk>/delete/', views.ProductServiceDeleteView.as_view(), name='product-service-delete'),
    path('profile/', views.VendorProfileView.as_view(), name='vendor-profile'),
    path('profile/update/', views.VendorProfileUpdateView.as_view(), name='vendor-profile-update'),
    path('profile/image/', views.VendorProfileImageUploadView.as_view(), name='vendor-profile-image-upload'),
    path('profile/images/', views.VendorImageListView.as_view(), name='vendor-images-list'),
    path('profile/images/upload/', views.VendorImageUploadView.as_view(), name='vendor-images-upload'),
    path('profile/images/<int:pk>/', views.VendorImageUpdateView.as_view(), name='vendor-image-update'),
    path('profile/products-services/', views.MyVendorProductsServicesView.as_view(), name='my-vendor-products-services'),
    path('products-services/<int:pk>/image/', views.ProductServiceImageUploadView.as_view(), name='product-service-image-upload'),
    path('products-services/<int:pk>/images/', views.ProductImageListView.as_view(), name='product-images-list'),
    path('products-services/<int:pk>/images/upload/', views.ProductImageUploadView.as_view(), name='product-images-upload'),
    path('products-services/images/<int:pk>/', views.ProductImageUpdateView.as_view(), name='product-image-update'),
    path('stats/', views.VendorStatsView.as_view(), name='vendor-stats'),
]
