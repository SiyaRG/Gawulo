"""
Serializers for lookup data models.
"""

from rest_framework import serializers
from .models import (
    Country, CountryCodes, CountryFlags,
    Language, LanguageScripts, CountryLanguages,
    Currency, TimeZone
)


class CountryCodesSerializer(serializers.ModelSerializer):
    """Serializer for CountryCodes model."""
    
    class Meta:
        model = CountryCodes
        fields = ['id', 'calling_code', 'tld', 'currency_code', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CountryFlagsSerializer(serializers.ModelSerializer):
    """Serializer for CountryFlags model."""
    
    class Meta:
        model = CountryFlags
        fields = ['id', 'flag_svg_url', 'flag_png_64', 'flag_emoji', 'flag_alt_text', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CountrySerializer(serializers.ModelSerializer):
    """Serializer for Country model with nested codes and flags."""
    codes = CountryCodesSerializer(read_only=True)
    flags = CountryFlagsSerializer(read_only=True)
    
    class Meta:
        model = Country
        fields = [
            'iso_alpha2', 'country_name', 'iso_alpha3', 'iso_numeric',
            'region', 'sub_region', 'latitude', 'longitude',
            'is_active', 'created_at', 'updated_at', 'codes', 'flags'
        ]
        read_only_fields = ['iso_alpha2', 'created_at', 'updated_at']


class LanguageScriptsSerializer(serializers.ModelSerializer):
    """Serializer for LanguageScripts model."""
    
    class Meta:
        model = LanguageScripts
        fields = ['id', 'script_code', 'script_name', 'is_rtl', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LanguageSerializer(serializers.ModelSerializer):
    """Serializer for Language model with nested scripts."""
    scripts = LanguageScriptsSerializer(many=True, read_only=True)
    
    class Meta:
        model = Language
        fields = [
            'iso_639_1', 'language_name_en', 'native_name', 'iso_639_2',
            'type', 'is_active', 'created_at', 'updated_at', 'scripts'
        ]
        read_only_fields = ['iso_639_1', 'created_at', 'updated_at']


class CountryLanguagesSerializer(serializers.ModelSerializer):
    """Serializer for CountryLanguages model with nested country and language details."""
    country_name = serializers.CharField(source='country.country_name', read_only=True)
    country_iso_alpha2 = serializers.CharField(source='country.iso_alpha2', read_only=True)
    language_name = serializers.CharField(source='language.language_name_en', read_only=True)
    language_iso_639_1 = serializers.CharField(source='language.iso_639_1', read_only=True)
    
    class Meta:
        model = CountryLanguages
        fields = [
            'id', 'country', 'country_name', 'country_iso_alpha2',
            'language', 'language_name', 'language_iso_639_1',
            'is_official', 'is_primary', 'percentage_of_speakers',
            'status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CurrencySerializer(serializers.ModelSerializer):
    """Serializer for Currency model."""
    
    class Meta:
        model = Currency
        fields = [
            'id', 'name', 'code', 'symbol', 'numeric_code',
            'decimal_places', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TimeZoneSerializer(serializers.ModelSerializer):
    """Serializer for TimeZone model."""
    
    class Meta:
        model = TimeZone
        fields = [
            'id', 'name', 'display_name', 'offset_hours',
            'offset_minutes', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

