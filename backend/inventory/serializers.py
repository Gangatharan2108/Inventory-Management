from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from rest_framework import serializers
from django.db import transaction
from .models import *
from django.db.models import Sum, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal


User = get_user_model()

class DashboardProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    stock_percent = serializers.IntegerField(read_only=True)
    unit_short_name = serializers.CharField(source='unit.short_name', read_only=True)
    image = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = ['id', 'product_name', 'selling_price', 'minimum_stock', 'maximum_stock', 'stock_quantity', 'stock_percent', 'category', 'category_name', 'unit_short_name', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image:
            return request.build_absolute_uri(obj.image.url)
        return None

# UNIT

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ['id', 'name', 'short_name', 'unit_type', 'created_at']


# USER & PROFILE

class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    profile_image = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'email', 'role', 'phone', 'profile_image', 'is_active', 'permissions']

    def get_role(self, obj):
        return getattr(obj.userprofile, "role", None) if hasattr(obj, "userprofile") else None

    def get_phone(self, obj):
        return getattr(obj.userprofile, "phone", None) if hasattr(obj, "userprofile") else None
    
    def get_profile_image(self, obj):   # 👈 ADD THIS METHOD
        if hasattr(obj, "userprofile") and obj.userprofile.profile_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.userprofile.profile_image.url)
            return obj.userprofile.profile_image.url
        return None
    
    def get_permissions(self, obj):
        perms = obj.permissions.all()
        data = {}
        for p in perms:
            entry = {
                "view": p.can_view,
                "create": p.can_create,
                "update": p.can_update,
                "delete": p.can_delete,
            }
            if p.module == "dashboard":
                entry["fields"] = p.get_dashboard_fields_list()
            data[p.module] = entry
        return data

# ROLE PERMISSION

class RolePermissionSerializer(serializers.ModelSerializer):
    dashboard_fields_list = serializers.SerializerMethodField()

    class Meta:
        model = RolePermission
        fields = ['id', 'module', 'can_view', 'can_create', 'can_update', 'can_delete', 'dashboard_fields_list']

    def get_dashboard_fields_list(self, obj):
        return obj.get_dashboard_fields_list()
 
 
 # ROLE

class RoleSerializer(serializers.ModelSerializer):
    default_permissions = RolePermissionSerializer(many=True, read_only=True)
    user_count = serializers.SerializerMethodField()
 
    class Meta:
        model = Role
        fields = ['id', 'name', 'is_system', 'default_permissions', 'user_count', 'created_at']
        read_only_fields = ['is_system', 'created_at']
 
    def get_user_count(self, obj):
        return UserProfile.objects.filter(role=obj.name).count()
    

# CREATE USER

class CreateUserSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True)
    role = serializers.CharField(write_only=True)
    password1 = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)
    profile_image = serializers.ImageField(write_only=True, required=False)
 
    class Meta:
        model = User
        fields = ['username', 'first_name', 'email', 'phone', 'role', 'password1', 'password2', 'profile_image']
 
    def validate(self, attrs):
        if attrs['password1'] != attrs['password2']:
            raise serializers.ValidationError("Passwords do not match")
        validate_password(attrs['password1'])
        return attrs
 
    def create(self, validated_data):
        phone = validated_data.pop('phone')
        role = validated_data.pop('role')
        profile_image = validated_data.pop('profile_image', None)
        password = validated_data.pop('password1')
        validated_data.pop('password2')
 
        user = User.objects.create(
            username=validated_data['username'],
            first_name=validated_data['first_name'],
            email=validated_data['email']
        )
 
        user.set_password(password)
        user.save()
 
        UserProfile.objects.create(
            user=user,
            role=role,
            phone=phone,
            profile_image=profile_image
        )
 
        try:
            role_obj = Role.objects.get(name=role)
            for rp in role_obj.default_permissions.all():
                perm, created = Permission.objects.get_or_create(
                    user=user,
                    module=rp.module,
                    defaults={
                        'can_view': rp.can_view,
                        'can_create': rp.can_create,
                        'can_update': rp.can_update,
                        'can_delete': rp.can_delete,
                    }
                )
                if created and rp.module == "dashboard":
                    perm.set_dashboard_fields_list(rp.get_dashboard_fields_list())
                    perm.save()
        except Role.DoesNotExist:
            pass
        return user



# CATEGORY

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.ReadOnlyField()
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at', 'product_count']


# PARTY

class PartySerializer(serializers.ModelSerializer):
    total_purchase = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Party
        fields = [
            'id',
            'name',
            'party_type',
            'phone',
            'email',
            'address',
            'total_purchase',
            'total_paid',
            'balance',
            'created_at'
        ]

    def get_total_purchase(self, obj):
        if obj.party_type != "Supplier":
                return Decimal("0.00")

        total = obj.purchase_set.aggregate(
            total=Coalesce(
                Sum('total_amount'),
                Decimal("0.00"),
                output_field=DecimalField()
                )
            )['total']

        return total


    def get_total_paid(self, obj):
        if obj.party_type != "Supplier":
            return Decimal("0.00")

        total = obj.purchase_set.aggregate(
            total=Coalesce(
                Sum('paid_amount'),
                Decimal("0.00"),
                output_field=DecimalField()
            )
        )['total']

        return total


    def get_balance(self, obj):
        if obj.party_type != "Supplier":
            return Decimal("0.00")

        total_purchase = self.get_total_purchase(obj)
        total_paid = self.get_total_paid(obj)

        return total_purchase - total_paid


# PRODUCT

class ProductSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True)
    unit_short_name = serializers.CharField(source='unit.short_name', read_only=True)
    unit_type = serializers.CharField(source='unit.unit_type', read_only=True)
    sub_unit_name = serializers.CharField(source='sub_unit.name', read_only=True)
    sub_unit_short_name = serializers.CharField(source='sub_unit.short_name', read_only=True)
    sub_unit_type = serializers.CharField(source='sub_unit.unit_type', read_only=True)
    stock_percent = serializers.IntegerField(read_only=True)
    image = serializers.ImageField(required=False, allow_null=True)
    total_purchased = serializers.SerializerMethodField()
    total_sold = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'product_name', 'supplier', 'supplier_name',
            'category', 'category_name', 'unit', 'unit_name', 'unit_short_name', 'unit_type',
            'sub_unit', 'sub_unit_name', 'sub_unit_short_name', 'sub_unit_type', 'conversion_factor',
            'cost_price', 'selling_price', 'minimum_stock',
            'stock_percent', 'maximum_stock', 'stock_quantity',
            'image', 'total_purchased', 'total_sold', 'created_at'
        ]

    def validate(self, data):
        if data.get("minimum_stock") and data.get("maximum_stock"):
            if data["minimum_stock"] > data["maximum_stock"]:
                raise serializers.ValidationError({
                    "minimum_stock": "Minimum stock cannot exceed maximum stock"
                })
        return data

    def get_total_purchased(self, obj):
        return obj.purchaseitem_set.aggregate(total=Sum('quantity'))['total'] or 0

    def get_total_sold(self, obj):
        return obj.saleitem_set.aggregate(total=Sum('quantity'))['total'] or 0


# SALES

class SaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    unit_short_name = serializers.CharField(
        source='product.unit.short_name',
        read_only=True
    )
    # Sub-unit info — allows SaleDetail to toggle between base and sub-unit display
    sub_unit_short_name = serializers.CharField(
        source='product.sub_unit.short_name',
        read_only=True,
        allow_null=True,
        default=None
    )
    conversion_factor = serializers.DecimalField(
        source='product.conversion_factor',
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    per_item_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'quantity', 'per_item_price',
            'total_price', 'unit_short_name', 'sub_unit_short_name', 'conversion_factor'
        ]


class SaleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    worker_name = serializers.CharField(source='worker.first_name', read_only=True)
    items = SaleItemSerializer(many=True)
    class Meta:
        model = Sale
        fields = ['id', 'invoice_no', 'customer', 'customer_name', 'worker', 'worker_name', 'total_amount', 'payment_mode', 'created_at', 'items']
        read_only_fields = ['invoice_no', 'created_at'] 

    def create(self, validated_data):
        items_data = validated_data.pop('items')

        with transaction.atomic():
            sale = Sale.objects.create(**validated_data)

            for item in items_data:
                if 'per_item_price' not in item:
                    raise serializers.ValidationError("per_item_price missing")

                SaleItem.objects.create(
                    sale=sale,
                    product=item['product'],
                    quantity=item['quantity'],
                    per_item_price=item['per_item_price']
            )
        return sale
    
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance.customer = validated_data.get('customer', instance.customer)
        instance.worker = validated_data.get('worker', instance.worker)
        instance.payment_mode = validated_data.get('payment_mode', instance.payment_mode)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.save()

        instance.items.all().delete()
        for item_data in items_data:
            SaleItem.objects.create(sale=instance, **item_data)
        return instance


# PURCHASE ITEMS

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.product_name', read_only=True)
    unit_short_name = serializers.CharField(
        source='product.unit.short_name',
        read_only=True
    )
    class Meta:
        model = PurchaseItem
        fields = ['id', 'product', 'quantity', 'price', 'product_name', 'unit_short_name']


# PURCHASE (NESTED WRITE SUPPORT)

class PurchaseSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    items = PurchaseItemSerializer(many=True)
    due_amount = serializers.ReadOnlyField()
    purchase_no = serializers.ReadOnlyField()
    class Meta:
        model = Purchase
        fields = [ 
            'id',  'supplier', 'supplier_name', 'purchase_no', 'total_amount', 'paid_amount',
            'due_amount', 'payment_type', 'created_at', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')

        with transaction.atomic():
            purchase = Purchase.objects.create(**validated_data)

            for item_data in items_data:
                PurchaseItem.objects.create(
                    purchase=purchase,
                    **item_data
                )

            total = purchase.items.aggregate(
                total=Sum(F('quantity') * F('price'))
            )['total'] or Decimal('0')

            purchase.total_amount = total
            purchase.due_amount = total - purchase.paid_amount
            purchase.save()
        return purchase


# PAYMENT

class PaymentSerializer(serializers.ModelSerializer):
    party_name = serializers.CharField(source='party.name', read_only=True)
    class Meta:
        model = Payment
        fields = [
            'id', 'party', 'party_name', 'payment_type', 'amount', 'payment_mode', 'reference_no', 'created_at']


# STOCK ADJUSTMENT

class StockAdjustmentSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.product_name", read_only=True)
    class Meta:
        model = StockAdjustment
        fields = ['id', 'product', 'product_name', 'old_quantity', 'new_quantity', 'reason', 'adjusted_at', 'created_at']
        read_only_fields = ["created_at"]


# DAMAGED STOCK

class DamagedStockSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.product_name", read_only=True)
    class Meta:
        model = DamagedStock
        fields = ['id', 'product', 'product_name', 'quantity', 'reason', 'created_at']
        read_only_fields = ["created_at"]


# ACTIVITY LOG

class ActivitySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    class Meta:
        model = Activity
        fields = ['id', 'action', 'user', 'created_at']

    def get_user(self, obj):
        return obj.user.username if obj.user else "System"
    