from django.urls import path
from . import views

app_name = 'vendors'

urlpatterns = [
    # Vendor CRUD operations
    path('', views.VendorListView.as_view(), name='vendor-list'),
    path('search/', views.VendorSearchView.as_view(), name='vendor-search'),
    path('<uuid:pk>/', views.VendorDetailView.as_view(), name='vendor-detail'),
    path('register/', views.VendorRegistrationView.as_view(), name='vendor-register'),
    path('<uuid:pk>/update/', views.VendorUpdateView.as_view(), name='vendor-update'),
    path('<uuid:pk>/stats/', views.VendorStatsView.as_view(), name='vendor-stats'),
    path('<uuid:pk>/menu/', views.VendorMenuView.as_view(), name='vendor-menu'),
    path('<uuid:pk>/reviews/', views.VendorReviewsView.as_view(), name='vendor-reviews'),
    
    # Menu Items CRUD operations
    path('menu-items/', views.MenuItemListView.as_view(), name='menu-item-list'),
    path('menu-items/create/', views.MenuItemCreateView.as_view(), name='menu-item-create'),
    path('menu-items/<uuid:pk>/', views.MenuItemDetailView.as_view(), name='menu-item-detail'),
    path('menu-items/<uuid:pk>/update/', views.MenuItemUpdateView.as_view(), name='menu-item-update'),
    path('menu-items/<uuid:pk>/delete/', views.MenuItemDeleteView.as_view(), name='menu-item-delete'),
    
    # Menu Categories CRUD operations
    path('categories/', views.MenuCategoryListView.as_view(), name='category-list'),
    path('categories/create/', views.MenuCategoryCreateView.as_view(), name='category-create'),
]
