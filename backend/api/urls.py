"""
API URL routing for the Car Parts Marketplace.

All endpoints are prefixed with /api/ (set in config/urls.py).
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()

# Core resources
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"products", views.ProductViewSet, basename="product")
router.register(r"cart", views.CartViewSet, basename="cart")
router.register(r"orders", views.OrderViewSet, basename="order")

# Auth
router.register(r"auth", views.AuthViewSet, basename="auth")

# Seller dashboard
router.register(r"seller", views.SellerDashboardViewSet, basename="seller")

# Admin
router.register(r"admin/users", views.AdminUserViewSet, basename="admin-user")
router.register(r"admin/orders", views.AdminOrderViewSet, basename="admin-order")

# Chat
router.register(r"chat/conversations", views.ConversationViewSet, basename="chat-conversation")


urlpatterns = [
    path("health/", views.health_check, name="health_check"),
    path("", include(router.urls)),
    # Nested reviews under a product: /api/products/<product_pk>/reviews/
    path(
        "products/<int:product_pk>/reviews/",
        views.ReviewViewSet.as_view({"get": "list", "post": "create"}),
        name="product-reviews",
    ),
]
