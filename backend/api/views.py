from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
from django.core.signing import dumps, loads, BadSignature
from django.middleware.csrf import get_token
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.tokens import RefreshToken
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .models import (
    Category, Product, ProductImage, Review,
    Cart, CartItem, Order, OrderItem, SellerProfile,
)
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    CategorySerializer,
    ProductListSerializer, ProductDetailSerializer, ProductWriteSerializer,
    ProductImageSerializer, ReviewSerializer,
    CartSerializer, CartItemSerializer,
    OrderSerializer,
    SellerProfileSerializer,
    CustomTokenObtainPairSerializer,
)

User = get_user_model()

# Cookie settings for the refresh token
REFRESH_COOKIE_KEY = "refresh_token"
REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60  # 7 days in seconds
REFRESH_COOKIE_SECURE = False  # Set True in production (HTTPS only)
REFRESH_COOKIE_HTTPONLY = True
REFRESH_COOKIE_SAMESITE = "Lax"


def _set_refresh_cookie(response: Response, refresh_token: str) -> Response:
    """Set the refresh token as an HttpOnly cookie on the response."""
    response.set_cookie(
        key=REFRESH_COOKIE_KEY,
        value=str(refresh_token),
        max_age=REFRESH_COOKIE_MAX_AGE,
        secure=REFRESH_COOKIE_SECURE,
        httponly=REFRESH_COOKIE_HTTPONLY,
        samesite=REFRESH_COOKIE_SAMESITE,
        path="/",
    )
    return response


def _clear_refresh_cookie(response: Response) -> Response:
    """Delete the refresh token cookie."""
    response.delete_cookie(
        key=REFRESH_COOKIE_KEY,
        path="/",
        samesite=REFRESH_COOKIE_SAMESITE,
    )
    return response


# ---------------------------------------------------------------------------
# Permissions helpers
# ---------------------------------------------------------------------------
class IsOwnerOrReadOnly(permissions.BasePermission):
    """Allow owners to edit, everyone else read-only."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, "seller"):
            return obj.seller == request.user
        if hasattr(obj, "user"):
            return obj.user == request.user
        return False


class IsSeller(permissions.BasePermission):
    """Only allow users with is_seller=True."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_seller


# ---------------------------------------------------------------------------
# Auth views
# ---------------------------------------------------------------------------
class AuthViewSet(viewsets.ViewSet):
    """JWT-based authentication with HttpOnly refresh-token cookies."""
    permission_classes = [permissions.AllowAny]

    @action(detail=False, methods=["post"])
    def register(self, request):
        """Register a new user, return access token + set refresh cookie."""
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Create seller profile if registering as seller
        if user.is_seller:
            SellerProfile.objects.get_or_create(
                user=user,
                defaults={"store_name": f"{user.username}'s Store"},
            )

        # Generate JWT pair with custom claims
        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access = str(refresh.access_token)

        response = Response(
            {"access": access, "user": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )
        return _set_refresh_cookie(response, str(refresh))

    @action(detail=False, methods=["post"])
    def login(self, request):
        """Authenticate and return access token + set refresh cookie."""
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(
            username=serializer.validated_data["username"],
            password=serializer.validated_data["password"],
        )
        if not user:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        access = str(refresh.access_token)

        response = Response({"access": access, "user": UserSerializer(user).data})
        return _set_refresh_cookie(response, str(refresh))

    @action(detail=False, methods=["post"])
    def logout(self, request):
        """Clear the refresh token cookie."""
        response = Response({"detail": "Logged out"})
        return _clear_refresh_cookie(response)

    @action(detail=False, methods=["post"])
    def refresh(self, request):
        """Read refresh token from cookie, return new access + rotated refresh."""
        raw_token = request.COOKIES.get(REFRESH_COOKIE_KEY)
        if not raw_token:
            return Response(
                {"error": "No refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        try:
            old_refresh = RefreshToken(raw_token)
            # Get the user to include fresh data
            user = User.objects.get(id=old_refresh["user_id"])
            # Generate a new pair with custom claims
            new_refresh = CustomTokenObtainPairSerializer.get_token(user)
            access = str(new_refresh.access_token)

            response = Response({"access": access, "user": UserSerializer(user).data})
            return _set_refresh_cookie(response, str(new_refresh))
        except Exception:
            response = Response(
                {"error": "Invalid or expired refresh token"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            return _clear_refresh_cookie(response)

    @action(detail=False, methods=["get"])
    def csrf(self, request):
        """Return a CSRF token (also sets the csrftoken cookie)."""
        token = get_token(request)
        return Response({"csrfToken": token})

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Return the current authenticated user."""
        return Response(UserSerializer(request.user).data)

    @action(detail=False, methods=["post"])
    def google(self, request):
        """Verify Google token. If new user, return a temp token for profile completion."""
        credential = request.data.get("credential")
        if not credential:
            return Response({"error": "No credential provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            idinfo = id_token.verify_oauth2_token(
                credential, google_requests.Request(), settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY
            )
            email = idinfo.get("email")
            
            # Check if user exists
            user = User.objects.filter(email=email).first()
            if user:
                # Login directly
                refresh = CustomTokenObtainPairSerializer.get_token(user)
                access = str(refresh.access_token)
                response = Response({"access": access, "user": UserSerializer(user).data})
                return _set_refresh_cookie(response, str(refresh))
            else:
                # Need profile completion. Return temporary signed token.
                temp_data = {
                    "email": email,
                    "google_id": idinfo.get("sub"),
                    "name": idinfo.get("name", ""),
                    "avatar_url": idinfo.get("picture", "")
                }
                temp_token = dumps(temp_data, salt="google-auth-profile")
                return Response({
                    "status": "profile_incomplete",
                    "temp_token": temp_token,
                    "email": email,
                    "name": idinfo.get("name", "")
                }, status=status.HTTP_200_OK)
                
        except ValueError:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"])
    def complete_google(self, request):
        """Complete Google registration with a temp_token and profile info."""
        temp_token = request.data.get("temp_token")
        username = request.data.get("username")
        phone = request.data.get("phone", "")
        is_seller = request.data.get("is_seller", False)

        if not temp_token or not username:
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            data = loads(temp_token, salt="google-auth-profile", max_age=3600)  # 1 hour
            email = data["email"]
            
            # Create user
            if User.objects.filter(username=username).exists():
                return Response({"error": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)
            
            user = User.objects.create(
                username=username,
                email=email,
                phone=phone,
                is_seller=is_seller
            )
            user.set_unusable_password()
            user.save()

            if user.is_seller:
                SellerProfile.objects.get_or_create(
                    user=user,
                    defaults={"store_name": f"{user.username}'s Store"},
                )

            refresh = CustomTokenObtainPairSerializer.get_token(user)
            access = str(refresh.access_token)
            response = Response({"access": access, "user": UserSerializer(user).data}, status=status.HTTP_201_CREATED)
            return _set_refresh_cookie(response, str(refresh))

        except BadSignature:
            return Response({"error": "Invalid or expired session"}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def set_password(self, request):
        """Set password for users without one (e.g. Google auth)."""
        user = request.user
        if user.has_usable_password():
            return Response({"error": "You already have a password set"}, status=status.HTTP_400_BAD_REQUEST)
            
        password = request.data.get("password")
        if not password or len(password) < 8:
            return Response({"error": "Password must be at least 8 characters"}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(password)
        user.save()
        
        # Invalidate refresh tokens since password changed? Actually just tell user success
        return Response({"detail": "Password set successfully"})


# ---------------------------------------------------------------------------
# Category
# ---------------------------------------------------------------------------
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve product categories."""
    queryset = Category.objects.filter(parent__isnull=True)  # Top-level only
    serializer_class = CategorySerializer
    lookup_field = "slug"


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------
class ProductViewSet(viewsets.ModelViewSet):
    """Full CRUD for products. Sellers can create/update their own listings."""
    queryset = Product.objects.select_related("category", "seller").prefetch_related("images", "reviews")
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category__slug", "condition", "car_make", "car_model", "featured"]
    search_fields = ["title", "description", "car_make", "car_model"]
    ordering_fields = ["price", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        if self.action in ("create", "update", "partial_update"):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ("create",):
            return [IsSeller()]
        if self.action in ("update", "partial_update", "destroy"):
            return [IsSeller(), IsOwnerOrReadOnly()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        product = serializer.save(seller=self.request.user)
        # Handle multiple image uploads
        images_data = self.request.FILES.getlist("images")
        for i, image_data in enumerate(images_data):
            ProductImage.objects.create(
                product=product,
                image=image_data,
                is_primary=(i == 0) # Make first image primary
            )

    def perform_update(self, serializer):
        product = serializer.save()
        # Handle additional image uploads
        images_data = self.request.FILES.getlist("images")
        for image_data in images_data:
            ProductImage.objects.create(
                product=product,
                image=image_data,
                is_primary=False # Don't overwrite existing primary necessarily
            )
            
    @action(detail=True, methods=["delete"])
    def delete_image(self, request, pk=None):
        """Delete a specific image from a product."""
        product = self.get_object()
        image_id = request.query_params.get("image_id")
        
        if not image_id:
            return Response({"error": "image_id is required"}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            image = ProductImage.objects.get(id=image_id, product=product)
            # Cloudinary storage automatically deletes the file on Cloudinary when the model instance is deleted
            # if configured correctly, or we might need explicit cloudinary.api.delete_resources if it doesn't.
            # django-cloudinary-storage typically handles this or we can just delete the DB record.
            image.delete()
            return Response({"status": "Image deleted"}, status=status.HTTP_204_NO_CONTENT)
        except ProductImage.DoesNotExist:
            return Response({"error": "Image not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Return featured products for the home page."""
        products = self.queryset.filter(featured=True)[:12]
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def latest(self, request):
        """Return the latest products."""
        products = self.queryset.order_by("-created_at")[:12]
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)


# ---------------------------------------------------------------------------
# Review
# ---------------------------------------------------------------------------
class ReviewViewSet(viewsets.ModelViewSet):
    """Manage product reviews. Users can only create one review per product."""
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(product_id=self.kwargs.get("product_pk"))

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(
            user=self.request.user,
            product_id=self.kwargs["product_pk"],
        )


# ---------------------------------------------------------------------------
# Cart
# ---------------------------------------------------------------------------
class CartViewSet(viewsets.ViewSet):
    """Manage the authenticated user's shopping cart."""
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        """Get the current user's cart with all items."""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"])
    def add_item(self, request):
        """Add a product to the cart (or increase quantity)."""
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get("product_id")
        quantity = int(request.data.get("quantity", 1))

        item, created = CartItem.objects.get_or_create(
            cart=cart, product_id=product_id, defaults={"quantity": quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"])
    def update_item(self, request):
        """Update quantity of an item in the cart."""
        cart = Cart.objects.get(user=request.user)
        item_id = request.data.get("item_id")
        quantity = int(request.data.get("quantity", 1))

        try:
            item = CartItem.objects.get(id=item_id, cart=cart)
            if quantity <= 0:
                item.delete()
            else:
                item.quantity = quantity
                item.save()
        except CartItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"])
    def remove_item(self, request):
        """Remove an item from the cart entirely."""
        cart = Cart.objects.get(user=request.user)
        item_id = request.data.get("item_id")
        CartItem.objects.filter(id=item_id, cart=cart).delete()
        return Response(CartSerializer(cart).data)

    @action(detail=False, methods=["post"])
    def clear(self, request):
        """Empty the cart."""
        cart = Cart.objects.get(user=request.user)
        cart.items.all().delete()
        return Response(CartSerializer(cart).data)


# ---------------------------------------------------------------------------
# Order
# ---------------------------------------------------------------------------
class OrderViewSet(viewsets.ModelViewSet):
    """Manage orders. Users see only their own orders."""
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Order.objects.all()
        return Order.objects.filter(user=user)

    def create(self, request, *args, **kwargs):
        """Create an order from the current cart contents."""
        try:
            cart = Cart.objects.get(user=request.user)
        except Cart.DoesNotExist:
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        cart_items = cart.items.select_related("product").all()
        if not cart_items.exists():
            return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create order
        order = Order.objects.create(
            user=request.user,
            shipping_address=serializer.validated_data["shipping_address"],
            phone=serializer.validated_data.get("phone", ""),
            notes=serializer.validated_data.get("notes", ""),
            total=cart.total,
        )

        # Copy cart items into order items
        for ci in cart_items:
            OrderItem.objects.create(
                order=order,
                product=ci.product,
                product_title=ci.product.title,
                price=ci.product.price,
                quantity=ci.quantity,
            )

        # Clear the cart after order is placed
        cart.items.all().delete()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# Seller Dashboard
# ---------------------------------------------------------------------------
class SellerDashboardViewSet(viewsets.ViewSet):
    """Dashboard endpoints for sellers to manage their store."""
    permission_classes = [IsSeller]

    def list(self, request):
        """Return seller's profile, product count, and recent orders."""
        profile = SellerProfile.objects.filter(user=request.user).first()
        products = Product.objects.filter(seller=request.user)
        orders = OrderItem.objects.filter(product__seller=request.user).select_related("order")

        return Response({
            "profile": SellerProfileSerializer(profile).data if profile else None,
            "product_count": products.count(),
            "total_orders": orders.values("order").distinct().count(),
            "recent_products": ProductListSerializer(
                products[:5], many=True, context={"request": request}
            ).data,
        })

    @action(detail=False, methods=["get"])
    def products(self, request):
        """List all products belonging to the seller."""
        products = Product.objects.filter(seller=request.user)
        serializer = ProductListSerializer(products, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def orders(self, request):
        """List orders that contain the seller's products."""
        order_ids = (
            OrderItem.objects.filter(product__seller=request.user)
            .values_list("order_id", flat=True)
            .distinct()
        )
        orders = Order.objects.filter(id__in=order_ids)
        return Response(OrderSerializer(orders, many=True).data)


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------
class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only: manage all users."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminOrderViewSet(viewsets.ModelViewSet):
    """Admin-only: manage all orders."""
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAdminUser]
