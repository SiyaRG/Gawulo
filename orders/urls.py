from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    # Order CRUD operations
    path('', views.OrderListView.as_view(), name='order-list'),
    path('search/', views.OrderSearchView.as_view(), name='order-search'),
    path('stats/', views.OrderStatsView.as_view(), name='order-stats'),
    path('<uuid:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('create/', views.OrderCreateView.as_view(), name='order-create'),
    path('<uuid:pk>/update/', views.OrderUpdateView.as_view(), name='order-update'),
    path('<uuid:pk>/delete/', views.OrderDeleteView.as_view(), name='order-delete'),
    path('<uuid:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order-status-update'),
    
    # User-specific order views
    path('my-orders/', views.MyOrdersView.as_view(), name='my-orders'),
    path('vendor-orders/', views.VendorOrdersView.as_view(), name='vendor-orders'),
]
