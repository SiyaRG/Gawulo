#!/usr/bin/env python
"""
Data seeding script for Gawulo project.
Creates admin user and sample data for testing.
"""

import os
import sys
import django
from decimal import Decimal
from django.utils import timezone

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Gawulo.settings')
django.setup()

from django.contrib.auth.models import User
from vendors.models import Vendor, ProductService
from auth_api.models import Customer
from orders.models import Order, OrderLineItem, OrderStatusHistory


def create_sample_data():
    """Create sample data for the Gawulo system."""
    
    print("Creating sample data for Gawulo...")
    
    # Create admin user
    print("Creating admin user...")
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@gawulo.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("✓ Created admin user")
    else:
        # Update password if user already exists
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print("✓ Updated existing admin user")
    
    # Create sample customers
    print("Creating sample customers...")
    customer1_user, created = User.objects.get_or_create(
        username='customer1',
        defaults={
            'email': 'customer1@example.com',
            'first_name': 'John',
            'last_name': 'Doe'
        }
    )
    if created:
        customer1_user.set_password('password123')
        customer1_user.save()
        Customer.objects.create(user=customer1_user, display_name='John Doe')
        print("✓ Created customer1")
    
    customer2_user, created = User.objects.get_or_create(
        username='customer2',
        defaults={
            'email': 'customer2@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith'
        }
    )
    if created:
        customer2_user.set_password('password123')
        customer2_user.save()
        Customer.objects.create(user=customer2_user, display_name='Jane Smith')
        print("✓ Created customer2")
    
    # Create sample vendors
    print("Creating sample vendors...")
    
    # Vendor 1: Street Food Vendor
    vendor1_user, created = User.objects.get_or_create(
        username='street_food_vendor',
        defaults={
            'email': 'vendor1@gawulo.com',
            'first_name': 'Mama',
            'last_name': 'Zulu'
        }
    )
    if created:
        vendor1_user.set_password('vendor123')
        vendor1_user.save()
    
    vendor1, created = Vendor.objects.get_or_create(
        user=vendor1_user,
        defaults={
            'name': 'Mama Zulu\'s Street Food',
            'category': 'street_food',
            'profile_description': 'Authentic township street food with traditional recipes passed down through generations.',
            'is_verified': True,
            'average_rating': Decimal('4.5'),
            'review_count': 10
        }
    )
    if created:
        print("✓ Created Mama Zulu's Street Food")
    
    # Vendor 2: Home Kitchen
    vendor2_user, created = User.objects.get_or_create(
        username='home_kitchen_vendor',
        defaults={
            'email': 'vendor2@gawulo.com',
            'first_name': 'Auntie',
            'last_name': 'Ndlovu'
        }
    )
    if created:
        vendor2_user.set_password('vendor123')
        vendor2_user.save()
    
    vendor2, created = Vendor.objects.get_or_create(
        user=vendor2_user,
        defaults={
            'name': 'Auntie Ndlovu\'s Home Kitchen',
            'category': 'home_kitchen',
            'profile_description': 'Homemade traditional meals prepared with love and fresh ingredients.',
            'is_verified': True,
            'average_rating': Decimal('4.8'),
            'review_count': 8
        }
    )
    if created:
        print("✓ Created Auntie Ndlovu's Home Kitchen")
    
    # Create sample products/services
    print("Creating sample products/services...")
    
    if vendor1:
        products_vendor1 = [
            {
                'name': 'Pap and Wors',
                'description': 'Traditional South African pap with boerewors and tomato sauce',
                'current_price': Decimal('45.00'),
                'is_service': False
            },
            {
                'name': 'Chicken Curry',
                'description': 'Spicy chicken curry with rice and vegetables',
                'current_price': Decimal('55.00'),
                'is_service': False
            },
            {
                'name': 'Chakalaka',
                'description': 'Spicy vegetable relish',
                'current_price': Decimal('15.00'),
                'is_service': False
            }
        ]
        
        for product_data in products_vendor1:
            product, created = ProductService.objects.get_or_create(
                vendor=vendor1,
                name=product_data['name'],
                defaults=product_data
            )
            if created:
                print(f"✓ Created {product.name}")
    
    if vendor2:
        products_vendor2 = [
            {
                'name': 'Umngqusho',
                'description': 'Traditional Xhosa dish with samp and beans',
                'current_price': Decimal('40.00'),
                'is_service': False
            },
            {
                'name': 'Malva Pudding',
                'description': 'Traditional South African dessert with custard',
                'current_price': Decimal('25.00'),
                'is_service': False
            }
        ]
        
        for product_data in products_vendor2:
            product, created = ProductService.objects.get_or_create(
                vendor=vendor2,
                name=product_data['name'],
                defaults=product_data
            )
            if created:
                print(f"✓ Created {product.name}")
    
    print("\n🎉 Sample data creation completed!")
    print("\n📊 Summary:")
    print(f"  • Users: {User.objects.count()}")
    print(f"  • Customers: {Customer.objects.count()}")
    print(f"  • Vendors: {Vendor.objects.count()}")
    print(f"  • Products/Services: {ProductService.objects.count()}")
    print(f"  • Orders: {Order.objects.count()}")
    
    print("\n🔑 Login Credentials:")
    print("  • Admin: admin / admin123")
    print("  • Customer 1: customer1 / password123")
    print("  • Customer 2: customer2 / password123")
    print("  • Vendor 1: street_food_vendor / vendor123")
    print("  • Vendor 2: home_kitchen_vendor / vendor123")


if __name__ == '__main__':
    create_sample_data()
