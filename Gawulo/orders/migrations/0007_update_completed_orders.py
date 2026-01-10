# Generated migration to update existing orders

from django.db import migrations


def update_completed_orders(apps, schema_editor):
    """Update is_completed flag for orders with Delivered or PickedUp status."""
    Order = apps.get_model('orders', 'Order')
    
    # Update orders with Delivered or PickedUp status to is_completed = True
    Order.objects.filter(current_status__in=['Delivered', 'PickedUp']).update(is_completed=True)
    
    # Update all other orders to is_completed = False (for safety)
    Order.objects.exclude(current_status__in=['Delivered', 'PickedUp']).update(is_completed=False)
    
    print(f"Updated is_completed flag for orders with Delivered or PickedUp status")


def reverse_update(apps, schema_editor):
    """Reverse migration - set all is_completed to False."""
    Order = apps.get_model('orders', 'Order')
    Order.objects.all().update(is_completed=False)


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0006_refundrequest'),
    ]

    operations = [
        migrations.RunPython(update_completed_orders, reverse_update),
    ]

