#!/usr/bin/env python
"""
Data seeding script for ReachHub project.
Creates sample vendors, menu items, and other data for testing.
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
from vendors.models import Vendor, MenuCategory, MenuItem, VendorReview
from orders.models import Order, OrderItem, OrderStatusHistory


def create_sample_data():
    """Create sample data for the ReachHub system."""
    
    print("Creating sample data for ReachHub...")
    
    # Create sample users
    print("Creating users...")
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
    
    # Create sample customers
    customer1, created = User.objects.get_or_create(
        username='customer1',
        defaults={
            'email': 'customer1@example.com',
            'first_name': 'John',
            'last_name': 'Doe'
        }
    )
    if created:
        customer1.set_password('password123')
        customer1.save()
        print("✓ Created customer1")
    
    customer2, created = User.objects.get_or_create(
        username='customer2',
        defaults={
            'email': 'customer2@example.com',
            'first_name': 'Jane',
            'last_name': 'Smith'
        }
    )
    if created:
        customer2.set_password('password123')
        customer2.save()
        print("✓ Created customer2")
    
    # Create sample vendors
    print("Creating vendors...")
    
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
            'business_name': 'Mama Zulu\'s Street Food',
            'business_type': 'street_food',
            'description': 'Authentic township street food with traditional recipes passed down through generations.',
            'phone_number': '+27123456789',
            'email': 'vendor1@gawulo.com',
            'address': '123 Main Street, Soweto, Johannesburg',
            'latitude': -26.2041,
            'longitude': 28.0473,
            'operating_hours': {
                'monday': {'open': '08:00', 'close': '20:00'},
                'tuesday': {'open': '08:00', 'close': '20:00'},
                'wednesday': {'open': '08:00', 'close': '20:00'},
                'thursday': {'open': '08:00', 'close': '20:00'},
                'friday': {'open': '08:00', 'close': '22:00'},
                'saturday': {'open': '09:00', 'close': '22:00'},
                'sunday': {'open': '10:00', 'close': '18:00'}
            },
            'delivery_radius': 5,
            'minimum_order': Decimal('20.00'),
            'delivery_fee': Decimal('15.00'),
            'status': 'active',
            'is_verified': True,
            'rating': Decimal('4.5'),
            'total_orders': 150
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
            'business_name': 'Auntie Ndlovu\'s Home Kitchen',
            'business_type': 'home_kitchen',
            'description': 'Homemade traditional meals prepared with love and fresh ingredients.',
            'phone_number': '+27123456790',
            'email': 'vendor2@gawulo.com',
            'address': '456 Oak Avenue, Alexandra, Johannesburg',
            'latitude': -26.1089,
            'longitude': 28.0577,
            'operating_hours': {
                'monday': {'open': '10:00', 'close': '18:00'},
                'tuesday': {'open': '10:00', 'close': '18:00'},
                'wednesday': {'open': '10:00', 'close': '18:00'},
                'thursday': {'open': '10:00', 'close': '18:00'},
                'friday': {'open': '10:00', 'close': '20:00'},
                'saturday': {'open': '11:00', 'close': '20:00'},
                'sunday': {'open': '12:00', 'close': '16:00'}
            },
            'delivery_radius': 3,
            'minimum_order': Decimal('30.00'),
            'delivery_fee': Decimal('10.00'),
            'status': 'active',
            'is_verified': True,
            'rating': Decimal('4.8'),
            'total_orders': 89
        }
    )
    if created:
        print("✓ Created Auntie Ndlovu's Home Kitchen")
    
    # Create menu categories
    print("Creating menu categories...")
    
    # Categories for Vendor 1
    main_dishes1, created = MenuCategory.objects.get_or_create(
        vendor=vendor1,
        name='Main Dishes',
        defaults={
            'description': 'Traditional main courses',
            'sort_order': 1
        }
    )
    
    sides1, created = MenuCategory.objects.get_or_create(
        vendor=vendor1,
        name='Side Dishes',
        defaults={
            'description': 'Accompanying side dishes',
            'sort_order': 2
        }
    )
    
    drinks1, created = MenuCategory.objects.get_or_create(
        vendor=vendor1,
        name='Beverages',
        defaults={
            'description': 'Refreshing drinks',
            'sort_order': 3
        }
    )
    
    # Categories for Vendor 2
    main_dishes2, created = MenuCategory.objects.get_or_create(
        vendor=vendor2,
        name='Traditional Meals',
        defaults={
            'description': 'Authentic traditional dishes',
            'sort_order': 1
        }
    )
    
    desserts2, created = MenuCategory.objects.get_or_create(
        vendor=vendor2,
        name='Desserts',
        defaults={
            'description': 'Sweet treats and desserts',
            'sort_order': 2
        }
    )
    
    # Create menu items
    print("Creating menu items...")
    
    # Vendor 1 Menu Items
    menu_items_vendor1 = [
        {
            'category': main_dishes1,
            'name': 'Pap and Wors',
            'description': 'Traditional South African pap with boerewors and tomato sauce',
            'price': Decimal('45.00'),
            'preparation_time': 20,
            'is_featured': True
        },
        {
            'category': main_dishes1,
            'name': 'Chicken Curry',
            'description': 'Spicy chicken curry with rice and vegetables',
            'price': Decimal('55.00'),
            'preparation_time': 25,
            'is_featured': True
        },
        {
            'category': sides1,
            'name': 'Pap and Gravy',
            'description': 'Maize meal pap with rich meat gravy',
            'price': Decimal('25.00'),
            'preparation_time': 15
        },
        {
            'category': sides1,
            'name': 'Chakalaka',
            'description': 'Spicy vegetable relish',
            'price': Decimal('15.00'),
            'preparation_time': 10
        },
        {
            'category': drinks1,
            'name': 'Amarula',
            'description': 'Cream liqueur made from marula fruit',
            'price': Decimal('35.00'),
            'preparation_time': 5
        }
    ]
    
    for item_data in menu_items_vendor1:
        item, created = MenuItem.objects.get_or_create(
            vendor=vendor1,
            name=item_data['name'],
            defaults=item_data
        )
        if created:
            print(f"✓ Created {item.name}")
    
    # Vendor 2 Menu Items
    menu_items_vendor2 = [
        {
            'category': main_dishes2,
            'name': 'Umngqusho',
            'description': 'Traditional Xhosa dish with samp and beans',
            'price': Decimal('40.00'),
            'preparation_time': 30,
            'is_featured': True
        },
        {
            'category': main_dishes2,
            'name': 'Mogodu',
            'description': 'Tripe stew with onions and spices',
            'price': Decimal('35.00'),
            'preparation_time': 45
        },
        {
            'category': desserts2,
            'name': 'Malva Pudding',
            'description': 'Traditional South African dessert with custard',
            'price': Decimal('25.00'),
            'preparation_time': 20
        },
        {
            'category': desserts2,
            'name': 'Koesisters',
            'description': 'Spiced doughnuts in syrup',
            'price': Decimal('20.00'),
            'preparation_time': 15
        }
    ]
    
    for item_data in menu_items_vendor2:
        item, created = MenuItem.objects.get_or_create(
            vendor=vendor2,
            name=item_data['name'],
            defaults=item_data
        )
        if created:
            print(f"✓ Created {item.name}")
    
    # Create sample reviews
    print("Creating sample reviews...")
    
    reviews_data = [
        {
            'vendor': vendor1,
            'customer': customer1,
            'rating': 5,
            'comment': 'Amazing food! The pap and wors is exactly like my grandmother used to make.'
        },
        {
            'vendor': vendor1,
            'customer': customer2,
            'rating': 4,
            'comment': 'Great curry, very authentic taste. Will definitely order again!'
        },
        {
            'vendor': vendor2,
            'customer': customer1,
            'rating': 5,
            'comment': 'The umngqusho is perfect! Reminds me of home.'
        },
        {
            'vendor': vendor2,
            'customer': customer2,
            'rating': 4,
            'comment': 'Delicious food and great service. The malva pudding is to die for!'
        }
    ]
    
    for review_data in reviews_data:
        review, created = VendorReview.objects.get_or_create(
            vendor=review_data['vendor'],
            customer=review_data['customer'],
            defaults=review_data
        )
        if created:
            print(f"✓ Created review by {review.customer.username}")
    
    # Create sample orders
    print("Creating sample orders...")
    
    # Order 1
    order1, created = Order.objects.get_or_create(
        order_number='GAW202508291001',
        defaults={
            'customer': customer1,
            'vendor': vendor1,
            'delivery_type': 'delivery',
            'delivery_address': '789 Pine Street, Soweto, Johannesburg',
            'delivery_instructions': 'Please call when arriving',
            'subtotal': Decimal('70.00'),
            'delivery_fee': Decimal('15.00'),
            'tax_amount': Decimal('10.50'),
            'total_amount': Decimal('95.50'),
            'status': 'delivered',
            'estimated_delivery_time': timezone.now() + timezone.timedelta(hours=1),
            'actual_delivery_time': timezone.now() + timezone.timedelta(hours=1, minutes=15)
        }
    )
    
    if created:
        # Create order items
        pap_wors = MenuItem.objects.get(vendor=vendor1, name='Pap and Wors')
        OrderItem.objects.create(
            order=order1,
            menu_item=pap_wors,
            quantity=1,
            unit_price=pap_wors.price,
            total_price=pap_wors.price
        )
        
        chakalaka = MenuItem.objects.get(vendor=vendor1, name='Chakalaka')
        OrderItem.objects.create(
            order=order1,
            menu_item=chakalaka,
            quantity=1,
            unit_price=chakalaka.price,
            total_price=chakalaka.price
        )
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order1,
            status='pending',
            notes='Order created',
            updated_by=customer1
        )
        OrderStatusHistory.objects.create(
            order=order1,
            status='confirmed',
            notes='Order confirmed by vendor',
            updated_by=vendor1.user
        )
        OrderStatusHistory.objects.create(
            order=order1,
            status='delivered',
            notes='Order delivered successfully',
            updated_by=vendor1.user
        )
        
        print("✓ Created sample order 1")
    
    # Order 2
    order2, created = Order.objects.get_or_create(
        order_number='GAW202508291002',
        defaults={
            'customer': customer2,
            'vendor': vendor2,
            'delivery_type': 'pickup',
            'delivery_address': '',
            'subtotal': Decimal('65.00'),
            'delivery_fee': Decimal('0.00'),
            'tax_amount': Decimal('9.75'),
            'total_amount': Decimal('74.75'),
            'status': 'ready',
            'estimated_delivery_time': timezone.now() + timezone.timedelta(hours=1)
        }
    )
    
    if created:
        # Create order items
        umngqusho = MenuItem.objects.get(vendor=vendor2, name='Umngqusho')
        OrderItem.objects.create(
            order=order2,
            menu_item=umngqusho,
            quantity=1,
            unit_price=umngqusho.price,
            total_price=umngqusho.price
        )
        
        malva_pudding = MenuItem.objects.get(vendor=vendor2, name='Malva Pudding')
        OrderItem.objects.create(
            order=order2,
            menu_item=malva_pudding,
            quantity=1,
            unit_price=malva_pudding.price,
            total_price=malva_pudding.price
        )
        
        # Create status history
        OrderStatusHistory.objects.create(
            order=order2,
            status='pending',
            notes='Order created',
            updated_by=customer2
        )
        OrderStatusHistory.objects.create(
            order=order2,
            status='confirmed',
            notes='Order confirmed by vendor',
            updated_by=vendor2.user
        )
        OrderStatusHistory.objects.create(
            order=order2,
            status='ready',
            notes='Order ready for pickup',
            updated_by=vendor2.user
        )
        
        print("✓ Created sample order 2")
    
    print("\n🎉 Sample data creation completed!")
    print("\n📊 Summary:")
    print(f"  • Users: {User.objects.count()}")
    print(f"  • Vendors: {Vendor.objects.count()}")
    print(f"  • Menu Categories: {MenuCategory.objects.count()}")
    print(f"  • Menu Items: {MenuItem.objects.count()}")
    print(f"  • Reviews: {VendorReview.objects.count()}")
    print(f"  • Orders: {Order.objects.count()}")
    print(f"  • Order Items: {OrderItem.objects.count()}")
    
    print("\n🔑 Login Credentials:")
    print("  • Admin: admin / admin123")
    print("  • Customer 1: customer1 / password123")
    print("  • Customer 2: customer2 / password123")
    print("  • Vendor 1: street_food_vendor / vendor123")
    print("  • Vendor 2: home_kitchen_vendor / vendor123")


if __name__ == '__main__':
    create_sample_data()
