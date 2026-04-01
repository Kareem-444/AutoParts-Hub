# AutoParts Hub: Developer Documentation

Welcome to the **AutoParts Hub** documentation! This guide serves as a comprehensive technical reference for the current, stable state of the project. It describes the architecture, folder structure, key systems, and provides an exhaustive API and Database reference.

---

## 1. Project Overview

**AutoParts Hub** is a dynamic, full-stack marketplace tailored for automotive spare parts. 
- **Decoupled Architecture**: Next.js 15 frontend communicates with a Django 5.1/DRF backend.
- **Multilingual**: Supports English (LTR) and Arabic (RTL) natively via `next-intl`.
- **Real-Time**: Features a live chat system powered by Django Channels and WebSockets.
- **AI-Powered**: Includes "Aria," an intelligent automotive assistant for user support.

---

## 2. Architecture Overview

### Systems Diagram (Conceptual)
1. **Frontend (Next.js)**: Manages UI, i18n, Client-side state, and WebSocket connectivity.
2. **Backend (Django/Daphne)**: Manages Business Logic, Persistence, Auth, and WebSocket Consumers.
3. **Storage (Cloudinary)**: Handles all media binaries (Products, Avatars, Seller Logos).
4. **AI (Groq)**: Processes support queries via the Llama 3.3 model.

### Communication Flow
- **REST API**: JSON data exchange via the `apiClient` wrapper in the frontend.
- **WebSockets**: Bi-directional real-time messaging using `ws://` protocol.
- **Auth Flow**: JWT rotation. The frontend holds the `access_token` in memory, while the `refresh_token` is stored as an **HttpOnly cookie** by the backend.

---

## 3. Folder & File Structure

This section lists **every source file** in the project and its primary purpose.

### Backend (`/backend`)
| File | Description |
| :--- | :--- |
| `api/admin.py` | Admin interface configuration for all models. |
| `api/apps.py` | Django application setup for the `api` app. |
| `api/consumers.py` | WebSocket consumer logic for real-time chat. |
| `api/models.py` | Source of truth for the database schema. |
| `api/routing.py` | URL routing for WebSocket connections. |
| `api/serializers.py` | Data transformation logic for ORM objects to JSON. |
| `api/urls.py` | API endpoint definitions. |
| `api/views.py` | Request/Response logic and business rules. |
| `api/management/commands/seed.py` | Script to populate the DB with initial data. |
| `config/asgi.py` | ASGI server configuration for Channels/Daphne. |
| `config/settings.py` | Global project configuration (Apps, Middleware, JWT). |
| `config/urls.py` | Root URL configuration for the backend. |
| `config/wsgi.py` | WSGI server configuration for legacy production. |
| `manage.py` | Main Django CLI entry point. |

### Frontend (`/frontend`)
| File | Description |
| :--- | :--- |
| `src/app/[locale]/admin/page.tsx` | Staff-only admin page for managing users/orders. |
| `src/app/[locale]/auth/complete-profile/page.tsx` | Google OAuth registration finalization. |
| `src/app/[locale]/auth/login/page.tsx` | Local and Social login interface. |
| `src/app/[locale]/auth/register/page.tsx` | New account registration. |
| `src/app/[locale]/checkout/page.tsx` | Shopping cart review and order placement. |
| `src/app/[locale]/messages/page.tsx` | Centralized inbox for real-time chat. |
| `src/app/[locale]/products/[id]/loading.tsx` | Skeleton loading for product detail pages. |
| `src/app/[locale]/products/[id]/page.tsx` | Detailed product information view. |
| `src/app/[locale]/profile/loading.tsx` | Skeleton loading for user profiles. |
| `src/app/[locale]/profile/page.tsx` | Interactive user settings/order history dashboard. |
| `src/app/[locale]/search/page.tsx` | Main search engine results page. |
| `src/app/[locale]/search/SearchClient.tsx` | Logic for URL-driven search filtering. |
| `src/app/[locale]/seller/edit/[id]/page.tsx` | Product modification interface for sellers. |
| `src/app/[locale]/seller/new/page.tsx` | Product creation interface for sellers. |
| `src/app/[locale]/seller/loading.tsx` | Skeleton loading for seller dashboard. |
| `src/app/[locale]/seller/page.tsx` | Seller statistics and inventory management. |
| `src/app/[locale]/layout.tsx` | Global wrapper containing providers and base UI. |
| `src/app/[locale]/page.tsx` | Home page landing zone. |
| `src/components/AIAssistant/AIAssistantWidget.tsx` | Aria AI Assistant widget. |
| `src/components/Chat/ChatSidePanel.tsx` | Slide-out chat interface for specific products. |
| `src/components/ui/Modal.tsx` | Reusable global modal component. |
| `src/components/ui/Skeleton.tsx` | Primitive for shimmer loading wireframes. |
| `src/components/CategoryCard.tsx` | Icon-based link cards for categories. |
| `src/components/FiltersPanel.tsx` | Sidebar filters for search pages. |
| `src/components/GoogleLoginButton.tsx` | Localized custom Google auth trigger. |
| `src/components/LanguageSwitcher.tsx` | Locale toggle in navbar. |
| `src/components/Navbar.tsx` | Main navigation and status header. |
| `src/components/Pagination.tsx` | Standardized results pagination. |
| `src/components/ProductCard.tsx` | Standardized product listing card. |
| `src/components/ProductCardSkeleton.tsx` | Shimmer variant for ProductCard. |
| `src/components/StarRating.tsx` | UI component for review scores. |
| `src/context/AuthContext.tsx` | Global authentication and JWT state. |
| `src/context/CartContext.tsx` | Global shopping cart state management. |
| `src/context/ModalContext.tsx` | Global modal event/display management. |
| `src/i18n/request.ts` | next-intl request configuration. |
| `src/i18n/routing.ts` | next-intl routing and navigation utils. |
| `src/lib/api.ts` | Centralized `fetch` client with auth interceptors. |
| `src/lib/imageUtils.ts` | Utilities for Cloudinary URL formatting. |
| `src/messages/ar.json` | Arabic translation dictionary. |
| `src/messages/en.json` | English translation dictionary. |
| `src/types/index.ts` | Shared TypeScript interfaces and enums. |
| `src/middleware.ts` | Request middleware for locales and route protection. |

---

## 4. Key Systems Deep Dive

### a. Authentication & Authorization
- **JWT Flow**: Uses `rest_framework_simplejwt`. Login/Registration sets a `refresh_token` as an **HttpOnly cookie**. The frontend calls `/api/auth/refresh/` on mount and periodically to obtain a new `access_token` in memory.
- **Google OAuth**: A custom "manual" flow.
    1. Frontend gets `access_token` from Google.
    2. Backend verifies it and returns either an account or a `temp_token`.
    3. New users use `temp_token` on `/auth/complete-profile/` to finish registration.
- **Zero LocalStorage**: Tokens are never stored in `localStorage` to eliminate XSS theft surface.

### b. i18n & RTL Support
- Supported via `next-intl`. 
- **RTL**: Dynamically toggles based on locale. Uses logical CSS utilities (e.g., `ps-` instead of `pl-`) to ensure perfect layout flipping for Arabic.
- **Translation Keys**: All hardcoded strings are moved to `en.json` and `ar.json`.

### c. Real-Time Chat System
- **WebSockets**: Uses Django Channels. Connections are authenticated via a token passed in the query string (`ws://.../?token=...`).
- **Consumer**: `ChatConsumer` handles group joining (scoped to Conversation ID) and real-time message broadcasting.
- **State**: Messages are persisted in the `Message` model and served initially via REST, then live via Socket.

### d. Aria AI Assistant
- **Engine**: Groq Cloud (Llama 3.3 70B).
- **Personality**: Defined by a comprehensive system prompt that includes platform features, return policies, and context-aware page data.
- **History**: Persisted in `sessionStorage` per visitor session.

---

## 5. API Documentation

### Base URL: `/api`

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register/` | None | Register new user; sets refresh cookie. |
| `POST` | `/auth/login/` | None | Login; sets refresh cookie. |
| `POST` | `/auth/logout/` | None | Clears refresh cookie. |
| `POST` | `/auth/refresh/` | None | Rotates tokens; provides new access token. |
| `GET` | `/auth/me/` | JWT | Get current user's profile. |
| `POST` | `/auth/google/` | None | Start Google OAuth verification. |
| `POST` | `/auth/complete_google/`| None | Finalize Google account registration. |
| `GET` | `/products/` | None | List/Search products (Supports many filters). |
| `POST` | `/products/` | Seller | Add product (FormData with images). |
| `GET` | `/products/<id>/` | None | Retrieve product details (PDP). |
| `GET` | `/cart/` | JWT | Get current user's cart items. |
| `POST` | `/cart/add_item/` | JWT | Add/Increment item in cart. |
| `POST` | `/orders/` | JWT | Convert current cart to an Order. |
| `GET` | `/chat/conversations/` | JWT | List available chat threads. |
| `GET` | `/chat/conversations/<id>/messages/` | JWT | Get past messages for a thread. |

---

## 6. Database Schema

### `User` (AbstractUser)
- `is_seller`: Boolean
- `phone`: String
- `address`: Text
- `avatar`: CloudinaryField

### `Product`
- `title`, `description`, `price`, `stock`, `condition`
- `car_make`, `car_model`, `car_year`
- `seller`: ForeignKey(User)
- `category`: ForeignKey(Category)

### `Conversation`
- `product`: ForeignKey(Product)
- `buyer`: ForeignKey(User)
- `seller`: ForeignKey(User)

### `Message`
- `conversation`: ForeignKey(Conversation)
- `sender`: ForeignKey(User)
- `content`: Text
- `timestamp`: DateTime
- `is_read`: Boolean

---

## 7. Environment Variables

### Backend (`.env`)
- `SECRET_KEY`: Django security key.
- `GOOGLE_CLIENT_ID`: OAuth client ID.
- `GOOGLE_CLIENT_SECRET`: OAuth secret.
- `CLOUDINARY_CLOUD_NAME`: Image hosting account name.
- `CLOUDINARY_API_KEY`: Image hosting key.
- `CLOUDINARY_API_SECRET`: Image hosting secret.

### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL`: Path to Django API.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Public OAuth client ID.
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`: Public image account name.
- `NEXT_PUBLIC_GROQ_API_KEY`: Key for Aria Assistant.

---

## 8. Development & Extension Guidelines

- **Adding a Page**: Always create the directory inside `src/app/[locale]/` and include a `page.tsx`. Ensure all strings use the `t()` hook from `useTranslations`.
- **Modifying the Schema**: Update `models.py`, run `makemigrations`, and `migrate`.
- **Styling**: Use Tailwind CSS logical properties (e.g., `me-4`, `ps-2`) to ensure RTL compatibility remains unbroken.
- **API Retries**: The `apiClient` in `src/lib/api.ts` handles 401 retries automatically via silent refresh.
