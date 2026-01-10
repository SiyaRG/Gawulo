"""
Vendor models for the Gawulo platform.

Defines models for vendor profiles, products/services, and vendor documents.
"""

from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Vendor(models.Model):
    """
    Vendor profile model for vendors in the platform.
    
    Supports soft deletes and tracks verification status and ratings.
    """
    
    id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='vendor_profile')
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    profile_description = models.TextField(null=True, blank=True)
    profile_image = models.ImageField(upload_to='vendor_profiles/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    average_rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1, 
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(5.0)]
    )
    review_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Vendor'
        verbose_name_plural = 'Vendors'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} ({self.category})"
    
    def soft_delete(self):
        """Perform soft delete by setting deleted_at timestamp."""
        if not self.deleted_at:
            self.deleted_at = timezone.now()
            self.save()
    
    def restore(self):
        """Restore a soft-deleted vendor."""
        if self.deleted_at:
            self.deleted_at = None
            self.save()
    
    @property
    def is_deleted(self):
        """Check if vendor is soft-deleted."""
        return self.deleted_at is not None
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = Vendor.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class ProductService(models.Model):
    """
    Product or service model for vendor offerings.
    
    Can represent either a physical product or a service,
    with pricing and soft delete support.
    """
    
    id = models.AutoField(primary_key=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='products_services')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    current_price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)
    is_service = models.BooleanField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Product/Service'
        verbose_name_plural = 'Products/Services'
        ordering = ['-created_at']
    
    def __str__(self):
        item_type = "Service" if self.is_service else "Product"
        return f"{self.name} ({item_type}) - {self.vendor.name}"
    
    def soft_delete(self):
        """Perform soft delete by setting deleted_at timestamp."""
        if not self.deleted_at:
            self.deleted_at = timezone.now()
            self.save()
    
    def restore(self):
        """Restore a soft-deleted product/service."""
        if self.deleted_at:
            self.deleted_at = None
            self.save()
    
    @property
    def is_deleted(self):
        """Check if product/service is soft-deleted."""
        return self.deleted_at is not None
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = ProductService.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)


class ProductImage(models.Model):
    """
    Image model for product/service offerings.
    
    Supports multiple images per product with preview selection and ordering.
    """
    
    id = models.AutoField(primary_key=True)
    product_service = models.ForeignKey(ProductService, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='product_images/')
    is_preview = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Product Image'
        verbose_name_plural = 'Product Images'
        ordering = ['display_order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['product_service', 'is_preview'],
                condition=models.Q(is_preview=True),
                name='unique_preview_per_product'
            )
        ]
    
    def __str__(self):
        preview_text = " (Preview)" if self.is_preview else ""
        return f"{self.product_service.name} - Image {self.id}{preview_text}"
    
    def set_as_preview(self):
        """Set this image as preview and unset others for the same product."""
        # Unset all other preview images for this product
        ProductImage.objects.filter(
            product_service=self.product_service,
            is_preview=True
        ).exclude(id=self.id).update(is_preview=False)
        # Set this as preview
        self.is_preview = True
        self.save()


class VendorImage(models.Model):
    """
    Image model for vendor profiles.
    
    Supports multiple images per vendor with preview selection and ordering.
    """
    
    id = models.AutoField(primary_key=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='vendor_profiles/')
    is_preview = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Vendor Image'
        verbose_name_plural = 'Vendor Images'
        ordering = ['display_order', 'created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['vendor', 'is_preview'],
                condition=models.Q(is_preview=True),
                name='unique_preview_per_vendor'
            )
        ]
    
    def __str__(self):
        preview_text = " (Preview)" if self.is_preview else ""
        return f"{self.vendor.name} - Image {self.id}{preview_text}"
    
    def set_as_preview(self):
        """Set this image as preview and unset others for the same vendor."""
        # Unset all other preview images for this vendor
        VendorImage.objects.filter(
            vendor=self.vendor,
            is_preview=True
        ).exclude(id=self.id).update(is_preview=False)
        # Set this as preview
        self.is_preview = True
        self.save()


class VendorDocument(models.Model):
    """
    Document storage model for vendor-related documents.
    
    Stores file metadata and storage paths for vendor documents.
    """
    
    DOCUMENT_TYPES = (
        ('id_document', 'ID Document'),
        ('business_license', 'Business License'),
        ('food_handling_cert', 'Food Handling Certificate'),
        ('tax_clearance', 'Tax Clearance Certificate'),
        ('verification', 'Verification Document'),
        ('other', 'Other'),
    )
    
    id = models.AutoField(primary_key=True)
    vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='documents')
    file_name = models.CharField(max_length=255)
    document_type = models.CharField(max_length=100, choices=DOCUMENT_TYPES, null=True, blank=True)
    storage_path = models.CharField(max_length=512, null=True, blank=True)
    mime_type = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    
    class Meta:
        verbose_name = 'Vendor Document'
        verbose_name_plural = 'Vendor Documents'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.vendor.name}"
    
    def save(self, *args, **kwargs):
        """Prevent modification of created_at on existing records."""
        if self.pk:
            # Preserve original created_at when updating
            original = VendorDocument.objects.get(pk=self.pk)
            self.created_at = original.created_at
        super().save(*args, **kwargs)
