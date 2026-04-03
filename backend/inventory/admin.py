from django.contrib import admin
from .models import *


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):

    list_display = ('user','get_first_name','get_email','role','phone')
    search_fields = ('user__username','user__email','phone')
    list_filter = ('role',)
    list_select_related = ('user',)
    
    def get_first_name(self, obj):
        return obj.user.first_name
    get_first_name.short_description = "First Name"


    def get_email(self, obj):
        return obj.user.email
    get_email.short_description = "Email"



# CATEGORY

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)
    ordering = ("name",)
    readonly_fields = ("created_at",)



# UNIT

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "short_name", "unit_type", "created_at")
    search_fields = ("name", "short_name")
    readonly_fields = ("created_at",)



# PARTY

@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "party_type", "phone", "created_at")
    list_filter = ("party_type", "created_at")
    search_fields = ("name", "phone", "email")
    list_per_page = 25
    readonly_fields = ("created_at",)



# PRODUCT

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "product_name", "category", "unit", "cost_price", "selling_price", "stock_quantity", "maximum_stock", "minimum_stock", "created_at")
    list_filter = ("category", "unit", "created_at")
    search_fields = ("product_name",)
    list_per_page = 25
    readonly_fields = ("created_at",)



# SALE

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("invoice_no", "customer", "total_amount", "payment_mode", "created_at")
    list_filter = ("created_at", "payment_mode")
    search_fields = ("invoice_no", "customer__name")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)
    inlines = [SaleItemInline]


# PURCHASE ITEM INLINE

class PurchaseItemInline(admin.TabularInline):
    model = PurchaseItem
    extra = 0



# PURCHASE

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ("purchase_no", "supplier", "total_amount", "paid_amount", "due_amount", "created_at")
    list_filter = ("created_at",)
    search_fields = ("purchase_no", "supplier__name")
    date_hierarchy = "created_at"
    inlines = [PurchaseItemInline]
    readonly_fields = ("created_at",)



# PAYMENT

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "party", "amount", "payment_type", "payment_mode", "reference_no", "created_at")
    list_filter = ("payment_type", "payment_mode", "created_at", "party")
    search_fields = ("party__name", "reference_no")
    readonly_fields = ("created_at",)



# STOCK ADJUSTMENT

@admin.register(StockAdjustment)
class StockAdjustmentAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "old_quantity", "new_quantity", "created_at")
    list_filter = ("created_at", "product")
    search_fields = ("product__product_name", "reason")
    readonly_fields = ("created_at",)



# DAMAGED STOCK

@admin.register(DamagedStock)
class DamagedStockAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "quantity", "created_at")
    list_filter = ("created_at", "product")
    search_fields = ("product__product_name",)
    readonly_fields = ("created_at",)



# ACTIVITY LOG

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ("id", "action", "user", "created_at")
    list_filter = ("created_at", "user")
    search_fields = ("action", "user__username")
    date_hierarchy = "created_at"
    readonly_fields = ("created_at",)

# PASSWORD CHANGE REQUEST

@admin.register(PasswordChangeRequest)
class PasswordChangeRequestAdmin(admin.ModelAdmin):

    list_display = ("id", "user", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__username",)
    readonly_fields = ("created_at",)
    ordering = ("-created_at",)