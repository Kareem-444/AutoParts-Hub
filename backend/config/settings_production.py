import os
import dj_database_url
from config.settings import *

# ---------------------------------------------------------------------------
# Production Settings
# ---------------------------------------------------------------------------
DEBUG = False

SECRET_KEY = os.environ.get("SECRET_KEY")

# ALLOWED_HOSTS = your-backend.railway.app,api.example.com
ALLOWED_HOSTS = [h for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h]

# ---------------------------------------------------------------------------
# Database - Switch to PostgreSQL using dj-database-url
# ---------------------------------------------------------------------------
DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,
        ssl_require=True
    )
}

# ---------------------------------------------------------------------------
# CORS & CSRF - Origins from env vars
# ---------------------------------------------------------------------------
# CORS_ALLOWED_ORIGINS = https://your-frontend.vercel.app,https://example.com
CORS_ALLOWED_ORIGINS = [o for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",") if o]
# CSRF_TRUSTED_ORIGINS = https://your-frontend.vercel.app,https://example.com
CSRF_TRUSTED_ORIGINS = [o for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o]

# ---------------------------------------------------------------------------
# Security Headers & Cookies
# ---------------------------------------------------------------------------
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
SECURE_SSL_REDIRECT = True

# Essential for JWT-based auth across domains
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SAMESITE = "None"
CSRF_COOKIE_SAMESITE = "None"

# ---------------------------------------------------------------------------
# Static Files - Whitenoise for production serving
# ---------------------------------------------------------------------------
# Insert Whitenoise after SecurityMiddleware
if "django.middleware.security.SecurityMiddleware" in MIDDLEWARE:
    index = MIDDLEWARE.index("django.middleware.security.SecurityMiddleware")
    MIDDLEWARE.insert(index + 1, "whitenoise.middleware.WhiteNoiseMiddleware")

STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ---------------------------------------------------------------------------
# Channel Layers - Keeping InMemory for zero-redis setup as requested
# ---------------------------------------------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels.layers.InMemoryChannelLayer"
    }
}
