from django.urls import path
from . import views

app_name = 'orders'

urlpatterns = [
    path('', views.OrderListView.as_view(), name='order-list'),
    path('<int:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
    path('create/', views.OrderCreateView.as_view(), name='order-create'),
    path('<int:pk>/status/', views.OrderStatusUpdateView.as_view(), name='order-status-update'),
    path('<int:pk>/estimated-time/', views.OrderEstimatedTimeUpdateView.as_view(), name='order-estimated-time-update'),
    path('<int:pk>/cancel/', views.OrderCancelView.as_view(), name='order-cancel'),
    path('my-orders/', views.MyOrdersView.as_view(), name='my-orders'),
    path('my-reviews/', views.MyReviewsView.as_view(), name='my-reviews'),
    path('vendor-orders/', views.VendorOrdersView.as_view(), name='vendor-orders'),
    path('stats/', views.OrderStatsView.as_view(), name='order-stats'),
    path('<int:order_id>/review/', views.ReviewCreateView.as_view(), name='review-create'),
    path('reviews/<int:pk>/', views.ReviewDetailView.as_view(), name='review-detail'),
    path('refund-requests/', views.RefundRequestListView.as_view(), name='refund-request-list'),
    path('refund-requests/create/', views.RefundRequestCreateView.as_view(), name='refund-request-create'),
    path('refund-requests/<int:pk>/approve/', views.RefundRequestApproveView.as_view(), name='refund-request-approve'),
    path('refund-requests/<int:pk>/deny/', views.RefundRequestDenyView.as_view(), name='refund-request-deny'),
]
