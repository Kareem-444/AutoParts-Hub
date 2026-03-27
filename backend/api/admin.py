"""
Django admin configuration for Car Parts Marketplace.

Registers all models with the admin panel and customises list displays
for efficient management.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    User, Category, Product, ProductImage, Review,
    Cart, CartItem, Order, OrderItem, SellerProfile,
)


# ---------------------------------------------------------------------------
# Inline editors
# ---------------------------------------------------------------------------
class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


# ---------------------------------------------------------------------------
# Model admins
# ---------------------------------------------------------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "is_seller", "is_staff", "date_joined")
    list_filter = ("is_seller", "is_staff", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Marketplace", {"fields": ("is_seller", "phone", "address", "avatar")}),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "parent", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "price", "stock", "condition", "category", "seller", "featured", "created_at")
    list_filter = ("condition", "featured", "category")
    search_fields = ("title", "car_make", "car_model")
    inlines = [ProductImageInline]


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("product", "user", "rating", "created_at")
    list_filter = ("rating",)


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "updated_at")
    inlines = [CartItemInline]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "status", "total", "created_at")
    list_filter = ("status",)
    inlines = [OrderItemInline]


@admin.register(SellerProfile)
class SellerProfileAdmin(admin.ModelAdmin):
    list_display = ("store_name", "user", "created_at")
    search_fields = ("store_name",)
