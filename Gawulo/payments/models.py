"""
Payment models for the ReachHub Trust as a Service platform.

Defines models for payment processing, transaction tracking,
and offline payment capabilities.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from orders.models import Order
import uuid


class PaymentMethod(models.Model):
    """
    Available payment methods for the ReachHub system.
    
    Supports both online and offline payment options.
    """
    
    PAYMENT_TYPES = (
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('mobile_money', 'Mobile Money'),
        ('bank_transfer', 'Bank Transfer'),
        ('crypto', 'Cryptocurrency'),
        ('voucher', 'Voucher'),
    )
    
    name = models.CharField(max_length=100)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES)
    is_active = models.BooleanField(default=True)
    is_offline_capable = models.BooleanField(default=False)
    processing_fee = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    processing_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    
    # Configuration
    config = models.JSONField(default=dict, blank=True)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Payment Method'
        verbose_name_plural = 'Payment Methods'
    
    def __str__(self):
        return f"{self.name} ({self.get_payment_type_display()})"
    
    def calculate_fee(self, amount):
        """Calculate processing fee for a given amount."""
        fixed_fee = self.processing_fee
        percentage_fee = (amount * self.processing_fee_percentage) / 100
        return fixed_fee + percentage_fee


class Payment(models.Model):
    """
    Payment model for tracking all payment transactions.
    
    Supports offline payment recording and synchronization.
    """
    
    PAYMENT_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
        ('refunded', 'Refunded'),
    )
    
    # Basic Information
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='payments')
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.CASCADE)
    
    # Transaction Details
    transaction_id = models.CharField(max_length=100, unique=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    processing_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Offline Support
    created_offline = models.BooleanField(default=False)
    synced_to_server = models.BooleanField(default=False)
    sync_timestamp = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    notes = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
    
    def __str__(self):
        return f"Payment {self.transaction_id} - R{self.total_amount}"
    
    def save(self, *args, **kwargs):
        """Calculate total amount including processing fee."""
        if not self.total_amount:
            self.processing_fee = self.payment_method.calculate_fee(self.amount)
            self.total_amount = self.amount + self.processing_fee
        super().save(*args, **kwargs)
    
    def is_successful(self):
        """Check if payment was successful."""
        return self.status == 'completed'
    
    def can_be_refunded(self):
        """Check if payment can be refunded."""
        return self.status == 'completed' and not self.is_refunded()
    
    def is_refunded(self):
        """Check if payment has been refunded."""
        return self.status == 'refunded'


class OfflinePayment(models.Model):
    """
    Store offline payments for later synchronization.
    
    Handles payments recorded when the device is offline.
    """
    
    local_id = models.CharField(max_length=50, unique=True)
    order_id = models.UUIDField()
    customer_id = models.IntegerField()
    payment_method_id = models.IntegerField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    synced = models.BooleanField(default=False)
    sync_attempts = models.PositiveIntegerField(default=0)
    last_sync_attempt = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Offline Payment {self.local_id} - R{self.amount}"


class PaymentTransaction(models.Model):
    """
    Detailed transaction records for payment processing.
    
    Tracks individual steps in the payment process.
    """
    
    TRANSACTION_TYPES = (
        ('authorization', 'Authorization'),
        ('capture', 'Capture'),
        ('refund', 'Refund'),
        ('void', 'Void'),
        ('settlement', 'Settlement'),
    )
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='ZAR')
    
    # Gateway Information
    gateway_transaction_id = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Status
    status = models.CharField(max_length=20, choices=Payment.PAYMENT_STATUS, default='pending')
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.payment.transaction_id}"


class Refund(models.Model):
    """
    Refund model for tracking payment refunds.
    """
    
    REFUND_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    reason = models.TextField()
    refund_reference = models.CharField(max_length=100, blank=True)
    
    status = models.CharField(max_length=20, choices=REFUND_STATUS, default='pending')
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Refund for {self.payment.transaction_id} - R{self.amount}"


class PaymentGateway(models.Model):
    """
    Payment gateway configuration for different payment providers.
    """
    
    GATEWAY_TYPES = (
        ('payfast', 'PayFast'),
        ('paystack', 'PayStack'),
        ('stripe', 'Stripe'),
        ('paypal', 'PayPal'),
        ('custom', 'Custom'),
    )
    
    name = models.CharField(max_length=100)
    gateway_type = models.CharField(max_length=20, choices=GATEWAY_TYPES)
    is_active = models.BooleanField(default=True)
    is_test_mode = models.BooleanField(default=True)
    
    # Configuration
    api_key = models.CharField(max_length=255, blank=True)
    secret_key = models.CharField(max_length=255, blank=True)
    webhook_url = models.URLField(blank=True)
    config = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Payment Gateway'
        verbose_name_plural = 'Payment Gateways'
    
    def __str__(self):
        return f"{self.name} ({self.get_gateway_type_display()})"


class CustomerWallet(models.Model):
    """
    Customer wallet for storing credit and managing transactions.
    """
    
    customer = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Customer Wallet'
        verbose_name_plural = 'Customer Wallets'
    
    def __str__(self):
        return f"Wallet for {self.customer.username} - R{self.balance}"
    
    def can_make_payment(self, amount):
        """Check if wallet has sufficient balance for payment."""
        return self.balance >= amount
    
    def deduct_amount(self, amount):
        """Deduct amount from wallet balance."""
        if self.can_make_payment(amount):
            self.balance -= amount
            self.save()
            return True
        return False
    
    def add_amount(self, amount):
        """Add amount to wallet balance."""
        self.balance += amount
        self.save()
        return True


class WalletTransaction(models.Model):
    """
    Track wallet transactions for audit purposes.
    """
    
    TRANSACTION_TYPES = (
        ('credit', 'Credit'),
        ('debit', 'Debit'),
        ('refund', 'Refund'),
    )
    
    wallet = models.ForeignKey(CustomerWallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_before = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)
    
    reference = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.wallet.customer.username} - R{self.amount}"
