"""
Django management command to load country data from countries.md file.

This command parses JSON arrays from the countries.md file and populates
Country, CountryCodes, CountryFlags, Currency, and CountryLanguages models.
"""

import json
import os
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from lookups.models import (
    Country, CountryCodes, CountryFlags, Currency,
    Language, CountryLanguages
)


class Command(BaseCommand):
    help = 'Load country data from countries.md file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='lookups/data/countries.md',
            help='Path to the countries.md file (relative to project root)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without saving to database',
        )

    def handle(self, *args, **options):
        file_path = options['file']
        dry_run = options['dry_run']
        
        # Get absolute path
        if not os.path.isabs(file_path):
            base_dir = str(settings.BASE_DIR) if hasattr(settings.BASE_DIR, '__str__') else settings.BASE_DIR
            file_path = os.path.join(base_dir, file_path)
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        
        self.stdout.write(f'Loading country data from: {file_path}')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be saved'))
        
        # Parse JSON lines
        try:
            data_lines = self._parse_json_lines(file_path)
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error parsing file: {e}'))
            return
        
        # Statistics
        stats = {
            'countries_created': 0,
            'countries_updated': 0,
            'codes_created': 0,
            'codes_updated': 0,
            'flags_created': 0,
            'flags_updated': 0,
            'currencies_created': 0,
            'languages_created': 0,
            'country_languages_created': 0,
            'errors': 0,
        }
        
        # Process each country
        total_countries = len(data_lines[0]) if data_lines else 0
        self.stdout.write(f'Processing {total_countries} countries...')
        
        for idx in range(total_countries):
            try:
                country_data = self._extract_country_data(data_lines, idx)
                
                if not country_data.get('cca2'):
                    self.stdout.write(
                        self.style.WARNING(f'Skipping country at index {idx}: missing cca2')
                    )
                    stats['errors'] += 1
                    continue
                
                if dry_run:
                    self._process_country_dry_run(country_data, stats)
                else:
                    with transaction.atomic():
                        self._process_country(country_data, stats)
                
                # Progress indicator
                if (idx + 1) % 50 == 0:
                    self.stdout.write(f'Processed {idx + 1}/{total_countries} countries...')
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'Error processing country at index {idx}: {e}')
                )
                stats['errors'] += 1
                continue
        
        # Print statistics
        self._print_statistics(stats, dry_run)
    
    def _parse_json_lines(self, file_path):
        """Parse JSON arrays from each line of the file."""
        data_lines = []
        with open(file_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    data = json.loads(line)
                    data_lines.append(data)
                except json.JSONDecodeError as e:
                    self.stdout.write(
                        self.style.WARNING(
                            f'Warning: Could not parse line {line_num}: {e}. Skipping...'
                        )
                    )
                    # For line 5 (region/subregion), we'll handle it gracefully
                    if line_num == 5:
                        data_lines.append([])  # Empty array as placeholder
                    else:
                        raise
        return data_lines
    
    def _extract_country_data(self, data_lines, index):
        """Extract and combine country data from all lines at the given index."""
        country_data = {}
        
        # Line 1: cca2
        if len(data_lines) > 0 and index < len(data_lines[0]):
            country_data['cca2'] = data_lines[0][index].get('cca2')
        
        # Line 2: cca3
        if len(data_lines) > 1 and index < len(data_lines[1]):
            country_data['cca3'] = data_lines[1][index].get('cca3')
        
        # Line 3: ccn3
        if len(data_lines) > 2 and index < len(data_lines[2]):
            country_data['ccn3'] = data_lines[2][index].get('ccn3')
        
        # Line 4: name
        if len(data_lines) > 3 and index < len(data_lines[3]):
            name_data = data_lines[3][index].get('name', {})
            country_data['name'] = name_data
        
        # Line 5: region/subregion (may be empty due to JSON error)
        if len(data_lines) > 4 and index < len(data_lines[4]) and data_lines[4]:
            region_data = data_lines[4][index]
            country_data['region'] = region_data.get('region')
            country_data['subregion'] = region_data.get('subregion')
        
        # Line 6: latlng
        if len(data_lines) > 5 and index < len(data_lines[5]):
            latlng = data_lines[5][index].get('latlng', [])
            if latlng and len(latlng) >= 2:
                country_data['latitude'] = latlng[0]
                country_data['longitude'] = latlng[1]
        
        # Line 7: idd
        if len(data_lines) > 6 and index < len(data_lines[6]):
            country_data['idd'] = data_lines[6][index].get('idd', {})
        
        # Line 8: tld
        if len(data_lines) > 7 and index < len(data_lines[7]):
            tld_data = data_lines[7][index].get('tld', [])
            if tld_data:
                country_data['tld'] = tld_data[0]
        
        # Line 9: currencies
        if len(data_lines) > 8 and index < len(data_lines[8]):
            country_data['currencies'] = data_lines[8][index].get('currencies', {})
        
        # Line 10: flags
        if len(data_lines) > 9 and index < len(data_lines[9]):
            country_data['flags'] = data_lines[9][index].get('flags', {})
        
        # Line 11: languages
        if len(data_lines) > 10 and index < len(data_lines[10]):
            country_data['languages'] = data_lines[10][index].get('languages', {})
        
        # Line 12: flag emoji
        if len(data_lines) > 11 and index < len(data_lines[11]):
            country_data['flag_emoji'] = data_lines[11][index].get('flag')
        
        return country_data
    
    def _process_country(self, country_data, stats):
        """Process and save country data to database."""
        cca2 = country_data.get('cca2')
        if not cca2:
            return
        
        # Extract name
        name_data = country_data.get('name', {})
        country_name = name_data.get('common') or name_data.get('official', 'Unknown')
        
        # Create or update Country
        country, created = Country.objects.update_or_create(
            iso_alpha2=cca2,
            defaults={
                'country_name': country_name,
                'iso_alpha3': country_data.get('cca3', ''),
                'iso_numeric': country_data.get('ccn3', ''),
                'region': country_data.get('region'),
                'sub_region': country_data.get('subregion'),
                'latitude': self._to_decimal(country_data.get('latitude')),
                'longitude': self._to_decimal(country_data.get('longitude')),
                'is_active': True,
            }
        )
        
        if created:
            stats['countries_created'] += 1
        else:
            stats['countries_updated'] += 1
        
        # Create or update CountryCodes
        self._process_country_codes(country, country_data, stats)
        
        # Create or update CountryFlags
        self._process_country_flags(country, country_data, stats)
        
        # Create Currency records
        self._process_currencies(country_data, stats)
        
        # Create Language and CountryLanguages records
        self._process_languages(country, country_data, stats)
    
    def _process_country_dry_run(self, country_data, stats):
        """Simulate processing without saving to database."""
        cca2 = country_data.get('cca2')
        if not cca2:
            return
        
        name_data = country_data.get('name', {})
        country_name = name_data.get('common') or name_data.get('official', 'Unknown')
        
        # Check if country exists
        exists = Country.objects.filter(iso_alpha2=cca2).exists()
        if exists:
            stats['countries_updated'] += 1
        else:
            stats['countries_created'] += 1
        
        # Simulate other operations
        if country_data.get('idd') or country_data.get('tld') or country_data.get('currencies'):
            if CountryCodes.objects.filter(country_id=cca2).exists():
                stats['codes_updated'] += 1
            else:
                stats['codes_created'] += 1
        
        if country_data.get('flags'):
            if CountryFlags.objects.filter(country_id=cca2).exists():
                stats['flags_updated'] += 1
            else:
                stats['flags_created'] += 1
        
        # Count currencies and languages
        currencies = country_data.get('currencies', {})
        for currency_code in currencies.keys():
            if not Currency.objects.filter(code=currency_code).exists():
                stats['currencies_created'] += 1
        
        languages = country_data.get('languages', {})
        for lang_code, lang_name in languages.items():
            if not Language.objects.filter(iso_639_1=lang_code).exists():
                stats['languages_created'] += 1
            stats['country_languages_created'] += 1
    
    def _process_country_codes(self, country, country_data, stats):
        """Create or update CountryCodes record."""
        idd_data = country_data.get('idd', {})
        tld = country_data.get('tld')
        currencies = country_data.get('currencies', {})
        
        # Build calling code
        calling_code = None
        if idd_data:
            root = idd_data.get('root', '')
            suffixes = idd_data.get('suffixes', [])
            if root:
                if suffixes and len(suffixes) > 0:
                    # Remove + from root if present, we'll add it
                    root_clean = root.replace('+', '').strip()
                    suffix = str(suffixes[0]).strip() if suffixes[0] else ''
                    if root_clean and suffix:
                        calling_code = f"+{root_clean}{suffix}"
                    elif root_clean:
                        calling_code = f"+{root_clean}"
                else:
                    # Just use root, ensure it has +
                    calling_code = root if root.startswith('+') else f"+{root}"
        
        # Get first currency code
        currency_code = None
        if currencies:
            currency_code = list(currencies.keys())[0]
        
        # Clean TLD (remove leading dot)
        tld_clean = None
        if tld:
            tld_clean = str(tld).lstrip('.').strip()
            if not tld_clean:
                tld_clean = None
        
        # Only create if we have at least one field
        # Note: All fields are required in the model, so we need to provide defaults
        if calling_code or tld_clean or currency_code:
            try:
                codes, created = CountryCodes.objects.update_or_create(
                    country=country,
                    defaults={
                        'calling_code': calling_code or '',
                        'tld': tld_clean or '',
                        'currency_code': currency_code or '',
                    }
                )
            except Exception as e:
                # Handle unique constraint violations (e.g., duplicate TLD)
                # Try to get existing record and update it
                try:
                    codes = CountryCodes.objects.get(country=country)
                    codes.calling_code = calling_code or codes.calling_code or ''
                    codes.tld = tld_clean or codes.tld or ''
                    codes.currency_code = currency_code or codes.currency_code or ''
                    codes.save()
                    created = False
                except CountryCodes.DoesNotExist:
                    # If TLD is duplicate, use a placeholder or skip
                    if 'tld' in str(e).lower():
                        # Generate a unique TLD by appending country code
                        tld_clean = f"{tld_clean or ''}.{country.iso_alpha2.lower()}"[:5]
                    codes, created = CountryCodes.objects.update_or_create(
                        country=country,
                        defaults={
                            'calling_code': calling_code or '',
                            'tld': tld_clean or '',
                            'currency_code': currency_code or '',
                        }
                    )
            if created:
                stats['codes_created'] += 1
            else:
                stats['codes_updated'] += 1
    
    def _process_country_flags(self, country, country_data, stats):
        """Create or update CountryFlags record."""
        flags_data = country_data.get('flags', {})
        flag_emoji = country_data.get('flag_emoji')
        
        if flags_data or flag_emoji:
            flags, created = CountryFlags.objects.update_or_create(
                country=country,
                defaults={
                    'flag_svg_url': flags_data.get('svg', ''),
                    'flag_png_64': flags_data.get('png', ''),
                    'flag_alt_text': flags_data.get('alt'),
                    'flag_emoji': flag_emoji,
                }
            )
            if created:
                stats['flags_created'] += 1
            else:
                stats['flags_updated'] += 1
    
    def _process_currencies(self, country_data, stats):
        """Create Currency records from currency data."""
        currencies = country_data.get('currencies', {})
        
        for currency_code, currency_info in currencies.items():
            if not currency_code:
                continue
            
            currency_name = currency_info.get('name', currency_code) if isinstance(currency_info, dict) else str(currency_info)
            currency_symbol = currency_info.get('symbol', '') if isinstance(currency_info, dict) else ''
            
            # Generate a simple ISO 639-2-like code for the currency (first 3 uppercase letters of name)
            # This is a placeholder since we don't have ISO 4217 numeric codes
            currency, created = Currency.objects.update_or_create(
                code=currency_code,
                defaults={
                    'name': currency_name,
                    'symbol': currency_symbol,
                    'is_active': True,
                }
            )
            if created:
                stats['currencies_created'] += 1
    
    def _process_languages(self, country, country_data, stats):
        """Create Language and CountryLanguages records."""
        languages = country_data.get('languages', {})
        
        if not languages:
            return
        
        language_list = list(languages.items())
        
        for idx, (lang_code, lang_name) in enumerate(language_list):
            # REST Countries typically uses ISO 639-1 codes (2 chars) like 'en', 'es', 'fr'
            # If it's 3 chars, it might be ISO 639-2, but we'll use first 2 as ISO 639-1
            iso_639_1 = lang_code.lower()[:2]  # Take first 2 chars, lowercase
            
            # For ISO 639-2, if lang_code is 3 chars, use it; otherwise generate placeholder
            # Common mapping: use the 3-char code if available, otherwise derive from ISO 639-1
            if len(lang_code) == 3:
                iso_639_2 = lang_code.lower()
            else:
                # Generate a simple ISO 639-2 code by padding with first letter
                # This is a placeholder - in production you'd want a proper mapping table
                iso_639_2 = (iso_639_1 + iso_639_1[0]).lower()[:3]
            
            # Create or get Language record
            language, lang_created = Language.objects.update_or_create(
                iso_639_1=iso_639_1,
                defaults={
                    'language_name_en': lang_name if isinstance(lang_name, str) else str(lang_name),
                    'native_name': lang_name if isinstance(lang_name, str) else str(lang_name),
                    'iso_639_2': iso_639_2,
                    'type': 'living',  # Default to living
                    'is_active': True,
                }
            )
            
            if lang_created:
                stats['languages_created'] += 1
            
            # Create CountryLanguages record
            # Set first language as primary
            is_primary = (idx == 0)
            
            country_lang, cl_created = CountryLanguages.objects.update_or_create(
                country=country,
                language=language,
                defaults={
                    'is_official': False,  # Default as per plan
                    'is_primary': is_primary,
                    'percentage_of_speakers': None,  # Not available in source data
                    'status': None,  # Not available in source data
                }
            )
            
            if cl_created:
                stats['country_languages_created'] += 1
    
    def _to_decimal(self, value):
        """Convert value to Decimal, handling None and invalid values."""
        if value is None:
            return None
        try:
            return Decimal(str(value))
        except (ValueError, TypeError):
            return None
    
    def _print_statistics(self, stats, dry_run):
        """Print import statistics."""
        self.stdout.write(self.style.SUCCESS('\n' + '='*50))
        self.stdout.write(self.style.SUCCESS('Import Statistics'))
        self.stdout.write(self.style.SUCCESS('='*50))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('(DRY RUN - No changes were saved)'))
        
        self.stdout.write(f"Countries - Created: {stats['countries_created']}, Updated: {stats['countries_updated']}")
        self.stdout.write(f"Country Codes - Created: {stats['codes_created']}, Updated: {stats['codes_updated']}")
        self.stdout.write(f"Country Flags - Created: {stats['flags_created']}, Updated: {stats['flags_updated']}")
        self.stdout.write(f"Currencies - Created: {stats['currencies_created']}")
        self.stdout.write(f"Languages - Created: {stats['languages_created']}")
        self.stdout.write(f"Country Languages - Created: {stats['country_languages_created']}")
        
        if stats['errors'] > 0:
            self.stdout.write(self.style.ERROR(f"Errors: {stats['errors']}"))
        
        self.stdout.write(self.style.SUCCESS('='*50))

