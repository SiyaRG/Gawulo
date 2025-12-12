from django.contrib import admin
from .models import (
    Country, CountryCodes, CountryFlags, 
    Language, LanguageScripts, CountryLanguages,
    Currency, TimeZone
)


class CountryCodesInline(admin.StackedInline):
    """Inline admin for country codes."""
    model = CountryCodes
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class CountryFlagsInline(admin.StackedInline):
    """Inline admin for country flags."""
    model = CountryFlags
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


class CountryLanguagesInline(admin.TabularInline):
    """Inline admin for country languages."""
    model = CountryLanguages
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['country_name', 'iso_alpha2', 'iso_alpha3', 'iso_numeric', 'region', 'sub_region', 'is_active', 'created_at']
    list_filter = ['region', 'sub_region', 'is_active', 'created_at']
    search_fields = ['country_name', 'iso_alpha2', 'iso_alpha3', 'iso_numeric', 'region', 'sub_region']
    readonly_fields = ['iso_alpha2', 'created_at', 'updated_at']
    inlines = [CountryCodesInline, CountryFlagsInline, CountryLanguagesInline]
    fieldsets = (
        ('ISO Codes', {
            'fields': ('iso_alpha2', 'iso_alpha3', 'iso_numeric')
        }),
        ('Basic Information', {
            'fields': ('country_name', 'region', 'sub_region')
        }),
        ('Geographic Data', {
            'fields': ('latitude', 'longitude')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CountryCodes)
class CountryCodesAdmin(admin.ModelAdmin):
    list_display = ['country', 'calling_code', 'tld', 'currency_code', 'created_at']
    list_filter = ['currency_code', 'created_at']
    search_fields = ['country__country_name', 'country__iso_alpha2', 'calling_code', 'tld', 'currency_code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Country Reference', {
            'fields': ('country',)
        }),
        ('Codes', {
            'fields': ('calling_code', 'tld', 'currency_code')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CountryFlags)
class CountryFlagsAdmin(admin.ModelAdmin):
    list_display = ['country', 'flag_emoji', 'flag_alt_text', 'created_at']
    search_fields = ['country__country_name', 'country__iso_alpha2', 'flag_alt_text']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Country Reference', {
            'fields': ('country',)
        }),
        ('Flag Assets', {
            'fields': ('flag_svg_url', 'flag_png_64', 'flag_emoji', 'flag_alt_text')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


class LanguageScriptsInline(admin.TabularInline):
    """Inline admin for language scripts."""
    model = LanguageScripts
    extra = 0
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ['language_name_en', 'iso_639_1', 'iso_639_2', 'native_name', 'type', 'is_active', 'created_at']
    list_filter = ['type', 'is_active', 'created_at']
    search_fields = ['language_name_en', 'iso_639_1', 'iso_639_2', 'native_name']
    readonly_fields = ['iso_639_1', 'created_at', 'updated_at']
    inlines = [LanguageScriptsInline]
    fieldsets = (
        ('ISO Codes', {
            'fields': ('iso_639_1', 'iso_639_2')
        }),
        ('Basic Information', {
            'fields': ('language_name_en', 'native_name', 'type')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(LanguageScripts)
class LanguageScriptsAdmin(admin.ModelAdmin):
    list_display = ['language', 'script_name', 'script_code', 'is_rtl', 'created_at']
    list_filter = ['is_rtl', 'created_at']
    search_fields = ['language__language_name_en', 'language__iso_639_1', 'script_name', 'script_code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Language Reference', {
            'fields': ('language',)
        }),
        ('Script Information', {
            'fields': ('script_code', 'script_name', 'is_rtl')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(CountryLanguages)
class CountryLanguagesAdmin(admin.ModelAdmin):
    list_display = ['country', 'language', 'is_official', 'is_primary', 'percentage_of_speakers', 'status', 'created_at']
    list_filter = ['is_official', 'is_primary', 'status', 'created_at']
    search_fields = ['country__country_name', 'country__iso_alpha2', 'language__language_name_en', 'language__iso_639_1']
    readonly_fields = ['created_at', 'updated_at']
    fieldsets = (
        ('References', {
            'fields': ('country', 'language')
        }),
        ('Status', {
            'fields': ('is_official', 'is_primary', 'status')
        }),
        ('Demographics', {
            'fields': ('percentage_of_speakers',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Currency)
class CurrencyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'symbol', 'numeric_code', 'decimal_places', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'code', 'symbol', 'numeric_code']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'code', 'symbol', 'numeric_code')
        }),
        ('Formatting', {
            'fields': ('decimal_places',)
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TimeZone)
class TimeZoneAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'offset_hours', 'offset_minutes', 'is_active', 'created_at']
    list_filter = ['is_active', 'offset_hours', 'created_at']
    search_fields = ['name', 'display_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'name', 'display_name')
        }),
        ('Offset', {
            'fields': ('offset_hours', 'offset_minutes')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
