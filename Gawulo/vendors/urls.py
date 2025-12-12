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
]
