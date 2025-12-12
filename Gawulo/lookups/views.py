"""
API views for lookup data models.
"""

from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import (
    Country, CountryCodes, CountryFlags,
    Language, LanguageScripts, CountryLanguages,
    Currency, TimeZone
)
from .serializers import (
    CountrySerializer, CountryCodesSerializer, CountryFlagsSerializer,
    LanguageSerializer, LanguageScriptsSerializer, CountryLanguagesSerializer,
    CurrencySerializer, TimeZoneSerializer
)


# Country Views
class CountryListView(generics.ListAPIView):
    """List all active countries."""
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['region', 'sub_region', 'is_active']
    search_fields = ['country_name', 'iso_alpha2', 'iso_alpha3', 'iso_numeric']
    ordering_fields = ['country_name', 'iso_alpha2', 'created_at']
    ordering = ['country_name']


class CountryDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific country."""
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'iso_alpha2'


# Language Views
class LanguageListView(generics.ListAPIView):
    """List all active languages."""
    queryset = Language.objects.filter(is_active=True)
    serializer_class = LanguageSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['language_name_en', 'native_name', 'iso_639_1', 'iso_639_2']
    ordering_fields = ['language_name_en', 'iso_639_1', 'created_at']
    ordering = ['language_name_en']


class LanguageDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific language."""
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'iso_639_1'


# Currency Views
class CurrencyListView(generics.ListAPIView):
    """List all active currencies."""
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'symbol']
    ordering_fields = ['name', 'code', 'created_at']
    ordering = ['code']


class CurrencyDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific currency."""
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'code'


# TimeZone Views
class TimeZoneListView(generics.ListAPIView):
    """List all active timezones."""
    queryset = TimeZone.objects.filter(is_active=True)
    serializer_class = TimeZoneSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'display_name']
    ordering_fields = ['offset_hours', 'offset_minutes', 'name', 'created_at']
    ordering = ['offset_hours', 'offset_minutes', 'name']


class TimeZoneDetailView(generics.RetrieveAPIView):
    """Get detailed information about a specific timezone."""
    queryset = TimeZone.objects.all()
    serializer_class = TimeZoneSerializer
    permission_classes = [permissions.AllowAny]


# Country Languages View
class CountryLanguagesListView(generics.ListAPIView):
    """List country-language relationships."""
    queryset = CountryLanguages.objects.all()
    serializer_class = CountryLanguagesSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['country', 'language', 'is_official', 'is_primary', 'status']
    search_fields = ['country__country_name', 'language__language_name_en']
    ordering_fields = ['country__country_name', 'language__language_name_en', 'is_primary', 'is_official', 'created_at']
    ordering = ['country__country_name', '-is_primary', '-is_official']
