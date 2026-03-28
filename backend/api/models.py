"""
Data models for the Car Parts Marketplace.

Models
------
- User           – Extended Django user with seller flag, phone, and address.
- Category       – Hierarchical product categories (supports sub-categories).
- Product        – Car spare part listing with vehicle compatibility info.
- ProductImage   – Multiple images per product.
- Review         – Star rating + comment on a product.
- Cart / CartItem – Shopping cart per user.
- Order / OrderItem – Completed purchases.
- SellerProfile  – Extra info for seller accounts.
"""

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils.text import slugify
from cloudinary.models import CloudinaryField


# ---------------------------------------------------------------------------
# Custom User
# ---------------------------------------------------------------------------
class User(AbstractUser):
    """Extended user with marketplace-specific fields."""

    is_seller = models.BooleanField(
        default=False,
        help_text="Designates whether this user can list products for sale.",
    )
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    avatar = CloudinaryField("avatar", folder="autoparts/avatars", blank=True, null=True)

    class Meta:
        ordering = ["-date_joined"]

    def __str__(self):
        return self.username


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------
class Category(models.Model):
    """Product category with optional parent for sub-categories."""

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.TextField(blank=True)
    image = CloudinaryField("category_image", folder="autoparts/categories", blank=True, null=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
class Product(models.Model):
    """A car spare part listed for sale."""

    CONDITION_CHOICES = [
        ("new", "New"),
        ("used", "Used"),
        ("refurbished", "Refurbished"),
    ]

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=280, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    condition = models.CharField(max_length=15, choices=CONDITION_CHOICES, default="new")

    # Vehicle compatibility
    car_make = models.CharField(max_length=100, blank=True, help_text="e.g. Toyota")
    car_model = models.CharField(max_length=100, blank=True, help_text="e.g. Camry")
    car_year = models.CharField(max_length=50, blank=True, help_text="e.g. 2018-2023")

    # Relations
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, related_name="products"
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products"
    )

    # Metadata
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
            # Ensure uniqueness
            if Product.objects.filter(slug=self.slug).exists():
                self.slug = f"{self.slug}-{self.pk or 'new'}"
        super().save(*args, **kwargs)

    @property
    def average_rating(self):
        """Calculate the average star rating from reviews."""
        avg = self.reviews.aggregate(models.Avg("rating"))["rating__avg"]
        return round(avg, 1) if avg else 0

    @property
    def review_count(self):
        return self.reviews.count()

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Product Image
# ---------------------------------------------------------------------------
class ProductImage(models.Model):
    """Multiple images per product."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="images"
    )
    image = CloudinaryField("product_image", folder="autoparts/products")
    alt_text = models.CharField(max_length=200, blank=True)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-is_primary", "created_at"]

    def __str__(self):
        return f"Image for {self.product.title}"


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------
class Review(models.Model):
    """Product review with star rating."""

    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name="reviews"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reviews"
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("product", "user")  # One review per user per product

    def __str__(self):
        return f"{self.user.username} → {self.product.title} ({self.rating}★)"


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
class Cart(models.Model):
    """Shopping cart belonging to a single user."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart of {self.user.username}"

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())


class CartItem(models.Model):
    """A single item inside a cart."""

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ("cart", "product")

    @property
    def subtotal(self):
        return self.product.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product.title}"


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------
class Order(models.Model):
    """A completed purchase."""

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("shipped", "Shipped"),
        ("delivered", "Delivered"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders"
    )
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default="pending")
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    shipping_address = models.TextField()
    phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Order #{self.pk} by {self.user.username}"


class OrderItem(models.Model):
    """A single item inside an order (snapshot of product at purchase time)."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    product_title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField(default=1)

    @property
    def subtotal(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product_title}"


# ---------------------------------------------------------------------------
# Seller Profile
# ---------------------------------------------------------------------------
class SellerProfile(models.Model):
    """Extra information for seller accounts."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="seller_profile"
    )
    store_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    logo = CloudinaryField("seller_logo", folder="autoparts/sellers", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.store_name
