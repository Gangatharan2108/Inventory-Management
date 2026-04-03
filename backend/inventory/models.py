from django.db import models, transaction
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Sum, F
from decimal import Decimal
from django.utils.crypto import get_random_string


# USER PROFILE 

class UserProfile(models.Model):
    ROLE_CHOICES = (('Owner', 'Owner'), ('Manager', 'Manager'), ('Supervisor', 'Supervisor'), ('Employee', 'Employee'))
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    profile_image = models.ImageField(upload_to='users/', null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


# PERMISSION

class Permission(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="permissions")
    module = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    dashboard_fields = models.TextField(blank=True, default="")

    def get_dashboard_fields_list(self):
        if not self.dashboard_fields:
            return []
        return [f.strip() for f in self.dashboard_fields.split(",") if f.strip()]

    def set_dashboard_fields_list(self, fields_list):
        self.dashboard_fields = ",".join(fields_list) if fields_list else ""

    def __str__(self):
        return f"{self.user.username} - {self.module}"


# CATEGORY

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.name

    @property
    def product_count(self):
        return self.product_set.count() if hasattr(self, 'product_set') else 0


# UNIT

class Unit(models.Model):
    UNIT_TYPE_CHOICES = (
        ('Integer', 'Integer'),
        ('Decimal', 'Decimal'),
    )
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=20)
    unit_type = models.CharField(
        max_length=10,
        choices=UNIT_TYPE_CHOICES,
        default='Integer'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.unit_type})"


# PARTY (Customer / Supplier)

class Party(models.Model):
    PARTY_TYPE_CHOICES = [('Customer', 'Customer'), ('Supplier', 'Supplier')]
    name = models.CharField(max_length=200)
    party_type = models.CharField(max_length=20, choices=PARTY_TYPE_CHOICES)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# PRODUCT

class Product(models.Model):
    product_name = models.CharField(max_length=200)
    supplier = models.ForeignKey(Party, on_delete=models.SET_NULL, null=True, blank=True, limit_choices_to={'party_type': 'Supplier'}, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name='base_products')
    sub_unit = models.ForeignKey(Unit, on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_products')
    conversion_factor = models.DecimalField(max_digits=10, decimal_places=2, default=1, help_text="How many sub units = 1 base unit (e.g. 1 Bag = 40 Kg → 40)")
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    minimum_stock = models.PositiveIntegerField(default=0)
    maximum_stock = models.PositiveIntegerField(default=0)
    stock_quantity = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def stock_percent(self):
        if self.maximum_stock > 0:
            return int((self.stock_quantity / self.maximum_stock) * 100)
        return 0

    def __str__(self):
        return self.product_name


# SALE

class Sale(models.Model):
    invoice_no = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(
        'Party',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'party_type': 'Customer'}
    )
    worker = models.ForeignKey('auth.User', on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_mode = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Invoice {self.invoice_no}"

    @transaction.atomic
    def save(self, *args, **kwargs):
        if not self.invoice_no:
            self.invoice_no = self.generate_invoice_no()
        
        is_new = self.pk is None
        super().save(*args, **kwargs)

        if is_new and self.total_amount > 0 and self.customer:
            Payment.objects.create(
                party=self.customer,
                payment_type='Credit',
                amount=self.total_amount,
                payment_mode=self.payment_mode or 'Cash'
            )

    @staticmethod
    def generate_invoice_no():
        """
        Example: INV20260302-ABC123
        """
        from datetime import datetime
        today = datetime.now().strftime("%Y%m%d")
        random_str = get_random_string(length=6, allowed_chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        return f"INV{today}-{random_str}"


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.SET_NULL, null=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    per_item_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):

        unit_type = self.product.unit.unit_type
        has_sub_unit = self.product.sub_unit is not None

        if not has_sub_unit:
            if unit_type == "Integer":
                if self.quantity % 1 != 0:
                    raise ValueError("Only integer quantity allowed for this unit")
            elif unit_type == "Decimal":
                if self.quantity <= 0:
                    raise ValueError("Quantity must be greater than 0")
                if self.quantity.as_tuple().exponent < -4:
                    raise ValueError("Only 4 decimal places allowed")
        else:
            # Product has sub_unit — quantity is base-unit result of conversion
            if self.quantity <= 0:
                raise ValueError("Quantity must be greater than 0")

        if self.pk:
            old_item = SaleItem.objects.get(pk=self.pk)
            difference = self.quantity - old_item.quantity

        else:
            difference = self.quantity

        if difference > 0 and self.product.stock_quantity < difference:
            raise ValidationError(f"Only {self.product.stock_quantity} items available in stock")
        
        self.product.stock_quantity -= difference
        self.product.save()
        super().save(*args, **kwargs)

    @property
    def total_price(self):
        return self.quantity * self.per_item_price


# PURCHASE

class Purchase(models.Model):
    purchase_no = models.CharField(max_length=50, unique=True, blank=True)
    supplier = models.ForeignKey('Party', on_delete=models.CASCADE, limit_choices_to={'party_type': 'Supplier'})
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    due_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_type = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.purchase_no or ""

    @transaction.atomic
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        self.due_amount = (self.total_amount or 0) - (self.paid_amount or 0)

        super().save(*args, **kwargs)

        if not self.purchase_no:
            self.purchase_no = f"PUR-{self.pk:05d}"
            super().save(update_fields=['purchase_no'])

        if is_new and self.total_amount > 0:
            Payment.objects.create(
                party=self.supplier,
                payment_type='Debit',
                amount=self.total_amount,
                payment_mode=self.payment_type or 'Cash'
            )

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    @property
    def total(self):
        return self.quantity * self.price

    @transaction.atomic
    def save(self, *args, **kwargs):
        product = Product.objects.select_for_update().get(pk=self.product.pk)

        unit_type = product.unit.unit_type
        has_sub_unit = product.sub_unit is not None

        if not has_sub_unit:
            if unit_type == "Integer":
                if self.quantity % 1 != 0:
                    raise ValueError("Only integer quantity allowed for this unit")
            elif unit_type == "Decimal":
                if self.quantity <= 0:
                    raise ValueError("Quantity must be greater than 0")
                if self.quantity.as_tuple().exponent < -4:
                    raise ValueError("Only 4 decimal places allowed")
        else:
            if self.quantity <= 0:
                raise ValueError("Quantity must be greater than 0")

        current_stock = product.stock_quantity
        max_stock = product.maximum_stock

        if max_stock > 0:
            allowed_qty = max_stock - current_stock

            if allowed_qty <= 0:
                raise ValueError(
                    f"{product.product_name} stock already full (Max {max_stock})"
                )

            if self.quantity > allowed_qty:
                raise ValueError(
                    f"Cannot purchase {self.quantity}. Only {allowed_qty} allowed."
                )

        if not self.pk:
            product.stock_quantity += self.quantity
            product.save()

        super().save(*args, **kwargs)
        total = self.purchase.items.aggregate(total=Sum(F('quantity') * F('price')))['total'] or Decimal('0')
        self.purchase.total_amount = total
        self.purchase.save()


# PAYMENT

class Payment(models.Model):
    PAYMENT_TYPE_CHOICES = [('Credit', 'Credit'), ('Debit', 'Debit')]
    PAYMENT_MODE_CHOICES = [('Cash', 'Cash'), ('Bank', 'Bank'), ('UPI', 'UPI'), ('Other', 'Other')]
    party = models.ForeignKey('Party', on_delete=models.CASCADE)
    payment_type = models.CharField(max_length=10, choices=PAYMENT_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES)
    reference_no = models.CharField(max_length=50, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.party.name} - {self.payment_type} - {self.amount}"


# DAMAGED STOCK

class DamagedStock(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            self.product.stock_quantity -= self.quantity
            self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.product_name} - Damaged {self.quantity}"


# STOCK ADJUSTMENT

class StockAdjustment(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    old_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    new_quantity = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    adjusted_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.pk:
            difference = self.new_quantity - self.old_quantity
            self.product.stock_quantity += difference
            self.product.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.product_name} - Adjusted from {self.old_quantity} to {self.new_quantity}"


# ACTIVITY LOG

class Activity(models.Model):

    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout')
    ]
    action = models.CharField(max_length=100, choices=ACTION_CHOICES)
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user}"
    

# ROLE PERMISSION
SYSTEM_ROLES = ['Owner', 'Manager', 'Supervisor', 'Employee']
 
class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)
    is_system = models.BooleanField(default=False)   # True = built-in role, cannot delete
    created_at = models.DateTimeField(auto_now_add=True)
 
    class Meta:
        ordering = ['name']
 
    def __str__(self):
        return self.name
 
 
class RolePermission(models.Model):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='default_permissions')
    module = models.CharField(max_length=100)
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    dashboard_fields = models.TextField(blank=True, default="")

    def get_dashboard_fields_list(self):
        if not self.dashboard_fields:
            return []
        return [f.strip() for f in self.dashboard_fields.split(",") if f.strip()]

    def set_dashboard_fields_list(self, fields_list):
        self.dashboard_fields = ",".join(fields_list) if fields_list else ""
 
    class Meta:
        unique_together = ('role', 'module')
 
    def __str__(self):
        return f"{self.role.name} — {self.module}"
    

class PasswordChangeRequest(models.Model):
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected'),
        ('Completed', 'Completed'),
        ('Expired', 'Expired')
    ]
    REQUEST_TYPE_CHOICES = [
        ('password_change', 'Password Change'),
        ('account_resume', 'Account Resume'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    request_type = models.CharField(max_length=20, choices=REQUEST_TYPE_CHOICES, default='password_change')
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"