"""
DRF serializers for the Car Parts Marketplace API.

Each model has a serializer; some have separate read/write variants to
handle nested data efficiently.
"""

from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Category, Product, ProductImage, Review,
    Cart, CartItem, Order, OrderItem, SellerProfile,
)

User = get_user_model()


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""
    has_usable_password = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_seller", "phone", "address", "avatar", "avatar_url", "date_joined", "has_usable_password")
        read_only_fields = fields
        
    def get_has_usable_password(self, obj):
        return obj.has_usable_password()

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None


class UserUpdateSerializer(serializers.ModelSerializer):
    """Update user profile info (avatar, address)"""
    class Meta:
        model = User
        fields = ("avatar", "address")


class RegisterSerializer(serializers.ModelSerializer):
    """Create a new user account."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ("id", "username", "email", "password", "is_seller", "phone", "address")

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """Authenticate and return a token."""
    username = serializers.CharField()
    password = serializers.CharField()


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------
class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "name", "slug", "description", "image", "parent", "children", "product_count")

    def get_children(self, obj):
        children = obj.children.all()
        return CategorySerializer(children, many=True).data if children.exists() else []

    def get_product_count(self, obj):
        return obj.products.count()


# ---------------------------------------------------------------------------
# Product Image
# ---------------------------------------------------------------------------
class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "is_primary")


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------
class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = ("id", "user", "rating", "comment", "created_at")
        read_only_fields = ("id", "user", "created_at")


# ---------------------------------------------------------------------------
# Seller Profile
# ---------------------------------------------------------------------------
class SellerProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = SellerProfile
        fields = ("id", "user", "store_name", "description", "logo", "created_at")
        read_only_fields = ("id", "user", "created_at")


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    category_name = serializers.CharField(source="category.name", read_only=True)
    seller_name = serializers.CharField(source="seller.username", read_only=True)
    primary_image = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "title", "slug", "price", "stock", "condition",
            "car_make", "car_model", "car_year",
            "category", "category_name", "seller", "seller_name",
            "primary_image", "average_rating", "review_count",
            "featured", "created_at",
        )

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get("request")
            return request.build_absolute_uri(img.image.url) if request else img.image.url
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer with images, reviews, and seller info."""
    images = ProductImageSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    seller = UserSerializer(read_only=True)
    seller_profile = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id", "title", "slug", "description", "price", "stock", "condition",
            "car_make", "car_model", "car_year",
            "category", "seller", "seller_profile",
            "images", "reviews", "average_rating", "review_count",
            "featured", "created_at", "updated_at",
        )

    def get_seller_profile(self, obj):
        try:
            return SellerProfileSerializer(obj.seller.seller_profile).data
        except SellerProfile.DoesNotExist:
            return None


class ProductWriteSerializer(serializers.ModelSerializer):
    """Serializer for creating / updating products (seller-facing)."""
    
    images = serializers.ListField(
        child=serializers.ImageField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Product
        fields = (
            "id", "title", "description", "price", "stock", "condition",
            "car_make", "car_model", "car_year", "category", "featured",
            "images",
        )

    def create(self, validated_data):
        # Remove 'images' so DRF doesn't try to save files directly to the relation
        validated_data.pop("images", [])
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # Remove 'images' so DRF doesn't try to save files directly to the relation
        validated_data.pop("images", [])
        return super().update(instance, validated_data)


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ("id", "product", "product_id", "quantity", "subtotal")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "items", "total", "updated_at")


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------
class OrderItemSerializer(serializers.ModelSerializer):
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ("id", "product", "product_title", "price", "quantity", "subtotal")
        read_only_fields = ("id", "product_title", "price")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "id", "status", "total", "shipping_address", "phone",
            "notes", "items", "created_at", "updated_at",
        )
        read_only_fields = ("id", "total", "status", "created_at", "updated_at")


# ---------------------------------------------------------------------------
# Custom JWT (embeds role claims for Next.js middleware)
# ---------------------------------------------------------------------------
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Add custom claims so Next.js Edge middleware can check roles."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"] = user.username
        token["is_seller"] = user.is_seller
        token["is_staff"] = user.is_staff
        return token
