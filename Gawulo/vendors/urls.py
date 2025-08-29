from django.urls import path
from . import views

app_name = 'vendors'

urlpatterns = [
    path('', views.VendorListView.as_view(), name='vendor-list'),
    path('<uuid:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),
    path('register/', views.VendorRegistrationView.as_view(), name='vendor-register'),
    path('<uuid:pk>/menu/', views.VendorMenuView.as_view(), name='vendor-menu'),
    path('<uuid:pk>/reviews/', views.VendorReviewsView.as_view(), name='vendor-reviews'),
    path('menu-items/', views.MenuItemListView.as_view(), name='menu-item-list'),
    path('menu-items/<uuid:pk>/', views.MenuItemDetailView.as_view(), name='menu-item-detail'),
]
