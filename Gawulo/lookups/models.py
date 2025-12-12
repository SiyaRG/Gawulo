"""
Lookup data models for the Gawulo platform.

Defines models for reference data such as countries, languages, currencies,
and other lookup tables used throughout the application.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Country(models.Model):
    """
    Country lookup model for storing comprehensive country information.
    
    Uses ISO 3166-1 alpha-2 code as the primary identifier for universal compatibility.
    """
    
    iso_alpha2 = models.CharField(
        max_length=2, 
        primary_key=True,
        help_text='ISO 3166-1 alpha-2 code (e.g., US, CA)'
    )
    country_name = models.CharField(max_length=100, help_text='Official country name (e.g., United States of America)')
    iso_alpha3 = models.CharField(
        max_length=3, 
        unique=True,
        help_text='ISO 3166-1 alpha-3 code (e.g., USA, CAN)'
    )
    iso_numeric = models.CharField(
        max_length=3, 
        unique=True,
        help_text='ISO 3166-1 numeric code (e.g., 840, 124)'
    )
    region = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text='World Bank/UN major region (e.g., Americas, Europe)'
    )
    sub_region = models.CharField(
        max_length=50, 
        null=True, 
        blank=True,
        help_text='More granular region (e.g., Northern America)'
    )
    latitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
        help_text='Country centroid latitude for mapping'
    )
    longitude = models.DecimalField(
        max_digits=10, 
        decimal_places=7, 
        null=True, 
        blank=True,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
        help_text='Country centroid longitude for mapping'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Country'
        verbose_name_plural = 'Countries'
        ordering = ['country_name']
        indexes = [
            models.Index(fields=['iso_alpha2']),
            models.Index(fields=['iso_alpha3']),
            models.Index(fields=['iso_numeric']),
            models.Index(fields=['region', 'sub_region']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.country_name} ({self.iso_alpha2})"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = Country.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except Country.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class CountryCodes(models.Model):
    """
    Country codes model for communication and finance codes.
    
    Stores telephone codes, TLDs, and currency codes linked to countries.
    """
    
    id = models.AutoField(primary_key=True)
    country = models.OneToOneField(
        Country, 
        on_delete=models.CASCADE, 
        related_name='codes',
        to_field='iso_alpha2'
    )
    calling_code = models.CharField(
        max_length=10,
        help_text='International telephone code (e.g., 1, 44)'
    )
    tld = models.CharField(
        max_length=5, 
        unique=True,
        help_text='Top-level domain (e.g., .us, .ca)'
    )
    currency_code = models.CharField(
        max_length=3,
        help_text='ISO 4217 currency code (e.g., USD, CAD)'
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Country Codes'
        verbose_name_plural = 'Country Codes'
        ordering = ['country__country_name']
        indexes = [
            models.Index(fields=['calling_code']),
            models.Index(fields=['tld']),
            models.Index(fields=['currency_code']),
        ]
    
    def __str__(self):
        return f"{self.country.country_name} - {self.calling_code}, {self.tld}, {self.currency_code}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = CountryCodes.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except CountryCodes.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class CountryFlags(models.Model):
    """
    Country flags model for visual assets.
    
    Stores flag URLs and emoji representations for different use cases.
    """
    
    id = models.AutoField(primary_key=True)
    country = models.OneToOneField(
        Country, 
        on_delete=models.CASCADE, 
        related_name='flags',
        to_field='iso_alpha2'
    )
    flag_svg_url = models.CharField(
        max_length=255,
        help_text='URL to the high-resolution SVG flag file'
    )
    flag_png_64 = models.CharField(
        max_length=255,
        help_text='URL to a common 64px PNG flag file (for lists/mobile)'
    )
    flag_emoji = models.CharField(
        max_length=4, 
        null=True, 
        blank=True,
        help_text='Unicode/Emoji representation of the flag (e.g., 🇺🇸)'
    )
    flag_alt_text = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text='Alternative text describing the flag for accessibility'
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Country Flags'
        verbose_name_plural = 'Country Flags'
        ordering = ['country__country_name']
    
    def __str__(self):
        return f"{self.country.country_name} Flag"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = CountryFlags.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except CountryFlags.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class Language(models.Model):
    """
    Language lookup model for storing comprehensive language information.
    
    Uses ISO 639-1 code as the primary identifier for universal compatibility.
    """
    
    LANGUAGE_TYPES = (
        ('living', 'Living'),
        ('extinct', 'Extinct'),
        ('ancient', 'Ancient'),
        ('constructed', 'Constructed'),
        ('historical', 'Historical'),
    )
    
    iso_639_1 = models.CharField(
        max_length=2,
        primary_key=True,
        help_text='ISO 639-1 code (2-letter code, e.g., en, es, fr)'
    )
    language_name_en = models.CharField(
        max_length=50,
        help_text='Language name in English (e.g., Spanish)'
    )
    native_name = models.CharField(
        max_length=100,
        help_text='Language name as written in that language (e.g., Español)'
    )
    iso_639_2 = models.CharField(
        max_length=3,
        unique=True,
        help_text='ISO 639-2 code (3-letter code, e.g., spa)'
    )
    type = models.CharField(
        max_length=20,
        choices=LANGUAGE_TYPES,
        help_text='Classification (e.g., living, extinct, ancient)'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Language'
        verbose_name_plural = 'Languages'
        ordering = ['language_name_en']
        indexes = [
            models.Index(fields=['iso_639_1']),
            models.Index(fields=['iso_639_2']),
            models.Index(fields=['type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.language_name_en} ({self.iso_639_1})"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = Language.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except Language.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class LanguageScripts(models.Model):
    """
    Language scripts model for writing systems.
    
    Handles script/writing system details using ISO 15924 standard.
    A single language can be written in multiple scripts (e.g., Serbian).
    """
    
    id = models.AutoField(primary_key=True)
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
        related_name='scripts',
        to_field='iso_639_1'
    )
    script_code = models.CharField(
        max_length=4,
        help_text='ISO 15924 script code (e.g., Latn, Cyrl, Arab)'
    )
    script_name = models.CharField(
        max_length=50,
        help_text='Name of the script (e.g., Latin, Cyrillic)'
    )
    is_rtl = models.BooleanField(
        default=False,
        help_text='True if the script is written Right-to-Left (e.g., Arabic)'
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Language Script'
        verbose_name_plural = 'Language Scripts'
        ordering = ['language__language_name_en', 'script_name']
        unique_together = [['language', 'script_code']]
        indexes = [
            models.Index(fields=['language', 'script_code']),
            models.Index(fields=['is_rtl']),
        ]
    
    def __str__(self):
        return f"{self.language.language_name_en} - {self.script_name} ({self.script_code})"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = LanguageScripts.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except LanguageScripts.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class CountryLanguages(models.Model):
    """
    Country languages junction model for usage and demographics.
    
    Links languages to countries in a many-to-many relationship,
    defining the status and prevalence of a language in a specific country.
    """
    
    LANGUAGE_STATUS = (
        ('official', 'Official'),
        ('de_facto_national', 'De Facto National'),
        ('regional', 'Regional'),
        ('minority', 'Minority'),
        ('recognized', 'Recognized'),
        ('working', 'Working'),
    )
    
    country = models.ForeignKey(
        Country,
        on_delete=models.CASCADE,
        related_name='languages',
        to_field='iso_alpha2'
    )
    language = models.ForeignKey(
        Language,
        on_delete=models.CASCADE,
        related_name='countries',
        to_field='iso_639_1'
    )
    is_official = models.BooleanField(
        default=False,
        help_text='True if the language is an official language of the country'
    )
    is_primary = models.BooleanField(
        default=False,
        help_text='True if this is the most common language spoken by the population'
    )
    percentage_of_speakers = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Percentage of the country's population that speaks this language"
    )
    status = models.CharField(
        max_length=50,
        choices=LANGUAGE_STATUS,
        null=True,
        blank=True,
        help_text='Detailed status (e.g., de facto national, minority, regional)'
    )
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Country Language'
        verbose_name_plural = 'Country Languages'
        ordering = ['country__country_name', '-is_primary', '-is_official', 'language__language_name_en']
        unique_together = [['country', 'language']]
        indexes = [
            models.Index(fields=['country', 'language']),
            models.Index(fields=['is_official']),
            models.Index(fields=['is_primary']),
        ]
    
    def __str__(self):
        return f"{self.country.country_name} - {self.language.language_name_en}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = CountryLanguages.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except CountryLanguages.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class Currency(models.Model):
    """
    Currency lookup model for storing currency information.
    
    Provides standardized currency data for pricing, payments, etc.
    """
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=3, unique=True, help_text='ISO 4217 currency code (e.g., USD, EUR, ZAR)')
    symbol = models.CharField(max_length=10, null=True, blank=True, help_text='Currency symbol (e.g., $, €, R)')
    numeric_code = models.CharField(max_length=3, unique=True, null=True, blank=True, help_text='ISO 4217 numeric code')
    decimal_places = models.IntegerField(default=2, help_text='Number of decimal places')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Currency'
        verbose_name_plural = 'Currencies'
        ordering = ['code']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        symbol_str = f" {self.symbol}" if self.symbol else ""
        return f"{self.name} ({self.code}){symbol_str}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = Currency.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except Currency.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)


class TimeZone(models.Model):
    """
    Timezone lookup model for storing timezone information.
    
    Provides standardized timezone data for scheduling, localization, etc.
    """
    
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True, help_text='Timezone name (e.g., Africa/Johannesburg)')
    display_name = models.CharField(max_length=200, help_text='Human-readable timezone name')
    offset_hours = models.IntegerField(help_text='UTC offset in hours')
    offset_minutes = models.IntegerField(default=0, help_text='Additional UTC offset in minutes')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        verbose_name = 'Timezone'
        verbose_name_plural = 'Timezones'
        ordering = ['offset_hours', 'offset_minutes', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        offset_str = f"{self.offset_hours:+d}"
        if self.offset_minutes:
            offset_str += f":{self.offset_minutes:02d}"
        return f"{self.display_name} (UTC{offset_str})"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Only preserve created_at if the record already exists in the database
            try:
                original = TimeZone.objects.get(pk=self.pk)
                self.created_at = original.created_at
            except TimeZone.DoesNotExist:
                # New record, let created_at be set by auto_now_add
                pass
        super().save(*args, **kwargs)
