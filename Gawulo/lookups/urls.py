"""
URL configuration for lookups app.
"""

from django.urls import path
from . import views

app_name = 'lookups'

urlpatterns = [
    # Country endpoints
    path('countries/', views.CountryListView.as_view(), name='country-list'),
    path('countries/<str:iso_alpha2>/', views.CountryDetailView.as_view(), name='country-detail'),
    
    # Language endpoints
    path('languages/', views.LanguageListView.as_view(), name='language-list'),
    path('languages/<str:iso_639_1>/', views.LanguageDetailView.as_view(), name='language-detail'),
    
    # Currency endpoints
    path('currencies/', views.CurrencyListView.as_view(), name='currency-list'),
    path('currencies/<str:code>/', views.CurrencyDetailView.as_view(), name='currency-detail'),
    
    # TimeZone endpoints
    path('timezones/', views.TimeZoneListView.as_view(), name='timezone-list'),
    path('timezones/<int:pk>/', views.TimeZoneDetailView.as_view(), name='timezone-detail'),
    
    # Country Languages endpoint
    path('country-languages/', views.CountryLanguagesListView.as_view(), name='country-languages-list'),
]

