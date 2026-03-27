"""
Root URL configuration for Car Parts Marketplace.

Routes:
  /admin/        → Django admin panel
  /api/          → REST API (handled by api app)
  /media/<path>  → User-uploaded media files (dev only)
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("api.urls")),
]

# Serve media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
