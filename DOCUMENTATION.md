# AutoParts Hub: Developer Documentation

Welcome to the **AutoParts Hub** documentation! This guide serves as a comprehensive handoff reference for developers, engineers, and AI models contributing to the project. It describes the system architecture, directory structures, features, and precise instructions to ensure safe extensibility.

---

## 1. Project Overview

**AutoParts Hub** is a dynamic, full-stack marketplace strictly tailored for automotive spare parts (both aftermarket and OEM). 

- **Target Users:** 
  1. *Buyers* looking to easily find matching auto parts (filtered by car make, model, year, and condition).
  2. *Sellers* operating as independent dealers or individuals wishing to manage their own storefront, inventory, and fulfill incoming orders.
- **Core Idea:** Provide a seamless, multilingual e-commerce experience similar to eBay Motors, equipped with high-performance search, real-time image handling, and local/social authentication.

---

## 2. Architecture Overview

**Frontend/Backend Separation:**
The project follows a decoupled monolithic API pattern.
- **Frontend (`/frontend`):** Built with Next.js 15 (App Router), leveraging React Server Components, TypeScript, and Tailwind CSS v4. It manages all UI rendering, internationalization (i18n), state management (Context API), and client-side routing.
- **Backend (`/backend`):** A Python 3.12 Django application exposing a RESTful API via Django REST Framework (DRF). It processes business logic, handles ORM database writes (SQLite locally, PostgreSQL ready), media uploads (via Cloudinary), and issues HTTP-only JSON Web Tokens (JWT).

**API Communication Flow:**
1. The frontend invokes an API route using a unified HTTP client (`src/lib/api.ts`).
2. Authentication asserts JWT tokens (Access Tokens in-memory, Refresh Tokens secured in HttpOnly browser cookies).
3. The Django middleware processes the incoming CSRF and JWT validations, routes logic, and returns serialized JSON.

**Media Handling:**
Images from the frontend (e.g. products, avatars) are transmitted as `multipart/form-data`. Django utilizes `django-cloudinary-storage` to stream uploads directly to the Cloudinary CDN. Only image URLs and metadata are preserved within the local database.

---

## 3. Folder & File Structure

An architectural snapshot of the most critical structural components.

### Frontend Structure (`/frontend`)
```bash
frontend/
├── src/
│   ├── app/                # Next.js App Router root
│   │   ├── [locale]/       # Dynamic locale routing (en/ar) for internationalization
│   │   │   ├── admin/      # Admin dashboards & analytics
│   │   │   ├── auth/       # Login, Registration, and Google Profile Completion
│   │   │   ├── checkout/   # Cart review and order finalization flows
│   │   │   ├── products/   # Product detail pages (PDP) with loading.tsx Skeletons
│   │   │   ├── profile/    # LinkedIn-style dashboard with Avatar upload and loading.tsx
│   │   │   ├── search/     # URL-driven advanced search & filter pages
│   │   │   ├── seller/     # Seller dashboard, inventory CRUD operations, and loading.tsx
│   │   │   ├── layout.tsx  # Root Layout (Google Provider, Auth Provider, Modal Provider, i18n)
│   │   │   └── page.tsx    # Landing page (hero, latest products, featured categories)
│   ├── components/         # Reusable UI elements (Navbar, ProductCards, ui/Skeleton, ui/Modal)
│   ├── context/            # React Contexts (AuthContext.tsx, CartContext.tsx, ModalContext.tsx)
│   ├── i18n/               # next-intl configuration and routing dictionaries
│   ├── lib/                # Shared utilities (api.ts for Fetch wrapping, apiFormData)
│   ├── messages/           # JSON translation dictionaries (en.json, ar.json)
│   ├── middleware.ts       # Edge middleware managing redirects, protected routes, and locale detection
│   └── types/              # TypeScript global interface definitions (index.ts)
```

### Backend Structure (`/backend`)
```bash
backend/
├── config/                 # Primary Django project directory
│   ├── settings.py         # Global configurations (Apps, CORS, JWT, Cloudinary, DB)
│   ├── urls.py             # Root URL routing
│   └── wsgi.py / asgi.py   # Application execution endpoints
├── api/                    # Core Django application handling all marketplace features
│   ├── models.py           # Database entities (User, Product, Category, Order, Profile)
│   ├── serializers.py      # DRF parsing (ModelSerializers for Read/Write flows)
│   ├── views.py            # API logic and ViewSets (AuthViewSet, ProductViewSet)
│   ├── urls.py             # Route configuration tied to ViewSets via DefaultRouter
│   └── admin.py            # Django built-in admin panel registrations for models
├── manage.py               # Django execution script
└── requirements.txt        # Python dependency manifest
```

> **Critical Files to Understand Before Editing:**
> - `src/lib/api.ts` (Frontend): Intercepts all fetch requests; injects credentials, CSRF headers, and initiates silent token refreshes automatically.
> - `api/views.py` (Backend): Contains business logic enforcing `IsSeller`, `IsOwnerOrReadOnly` execution permissions.

---

## 4. Key Systems Explained

### a. Authentication System
**Email & Password:**
DRF issues a JWT via `rest_framework_simplejwt`. To mitigate XSS vulnerabilities, the `refresh_token` is injected directly into an HttpOnly, SameSite=Lax cookie from the Django response. The frontend extracts the `access_token` and sustains it purely within React Context (`AuthContext`). Refreshes happen silently via iframe/fetch every 13 minutes.

**Google OAuth:**
Powered by `@react-oauth/google` on the frontend combined with `social-auth-app-django`/`google-auth` on the backend.
1. User clicks the customized Google Login button.
2. Frontend sends the Google `credential` payload (`POST /api/auth/google/`). 
3. Backend unpacks the Google certificate and validates the email signature.
4. **Profile Completion Logic:** If the user is logging in for the first time, Django returns a signed `temp_token` with `status: "profile_incomplete"`. The frontend traps this condition, persisting data in `sessionStorage`, and navigates to the `/auth/complete-profile/` page to finalize username layout and roles.

### b. i18n System
Powered by `next-intl`.
- **Pages Path:** All routes lie beneath `/app/[locale]/`. 
- **Language Switcher:** Triggered via `<Link href={path} locale="ar">`.
- **RTL Logic:** Based on the current locale, the `<html dir="rtl">` property transforms Tailwind's logical utilities (e.g., `ml-4` becomes `ms-4`, aligning left vs right dynamically).

### c. Seller Dashboard
A restricted interface conditionally rendered if `user.is_seller` is true.
Sellers construct products sending `FormData` directly to `POST /api/products/`. They can attach arrays of image bin files which are seamlessly intercepted by DRF serializers and handed off to the backend's image loops. Sellers update inventory metrics inside `<form>` wrappers dynamically mapped to Next.js Client Components.

### d. Search & Filters System
The search architecture relies intensely on browser URLs parameters avoiding fragmented internal state (`useState`) bloat.
- **Mechanics:** Any user selection (Car Make, Car Model, Condition Checkboxes) invokes `router.push('/search?make=Ford&condition=new')` replacing state gracefully.
- **Backend Sync:** The `ProductViewSet` employs `DjangoFilterBackend` scanning the `?make=` query parameter directly against the database logic.
- **Pagination Context:** Controlled exclusively via URL pointers (`?page=2`).

### e. Image Upload System
1. The frontend utilizes `<input type="file" multiple />` passing `File` objects inside an appended `FormData()` package using `apiFormData` utility wrapper.
2. Django’s `ProductViewSet.perform_create()` receives the media array `request.FILES.getlist("images")` looping through Cloudinary payload deployments. 
3. Cloudinary assigns randomized hashes to each image instantly generating a CDN HTTP link written to the `ProductImage` database table.
4. Single images or multiple galleries are properly mapped back to the client via `object-contain` classes ensuring zero distortion.

### f. Structural Skeleton Loaders
To simulate advanced Single Page Application (SPA) loading structures natively within App Router paradigms, all major components rely on a custom `<Skeleton />` building block. 
These are wired directly into App Router `loading.tsx` file paths (`/profile`, `/products/[id]`, `/seller`), as well as securely bridged into `use client` effect loaders overriding traditional HTTP buffering spinners with shimmer wireframes rendering instantly.

### g. Global Modal System
All legacy browser-blocking calls (`window.alert` and `window.confirm`) have been systematically replaced by a global generic modal API (`ModalContext.tsx`).
- Components invoke `const { showModal } = useModal()` triggering `success`, `error`, `warning`, or `confirm` UI blocks dynamically.
- Deletions run asynchronously optimizing backend sync operations via callback handlers (`onConfirm`).

---

## 5. API Documentation

*All API routes are prefixed by: `/api/`*

#### Auth
- `POST /auth/register/` -> Registers local user, sets HttpOnly cookie array, returns `{ access, user }`
- `POST /auth/login/` -> Verifies email & password.
- `PATCH /auth/update_profile/` -> Ingests `multipart/form-data` safely executing Django Model updates for Avatar and Address properties concurrently.
- `POST /auth/refresh/` -> Reads header cookie, emits active Token payload without login requirement.
- `POST /auth/logout/` -> Destroys server cookies terminating active session lifecycle.
- `POST /auth/google/` -> Intercepts Google ID token providing either an active token sequence or a `temp_token` trigger.
- `POST /auth/complete_google/` -> Binds a username format securely establishing a final Django User ID using the `temp_token` verification scope.
- `POST /auth/set_password/` -> Grants localized credentials to users instantiated previously via Google OAuth.

#### Products
- `GET /products/` -> Extrapolates paginated product arrays supporting query metrics `?category__slug=xyz`.
- `POST /products/` -> *Requires Seller.* Creates a new product. Expects `FormData`.
- `DELETE /products/<id>/delete_image/` -> Unlinks structural Product Images. 

#### Orders & Cart
- `GET/POST /cart/` -> Manipulate Cart allocations.
- `GET /orders/` -> Extracts Order history exclusively visible to the owner.

#### Seller API
- `GET /seller/` -> Emits comprehensive JSON payload containing sales volume, product counts, and profile configurations targeting Dashboard statistics charts.

---

## 6. How to Run the Project

### Django Backend
1. Open terminal inside `/backend`.
2. Generate Virtual Environment: `python -m venv venv`
3. Activate Environment: `venv\Scripts\activate` (Windows) or `source venv/bin/activate` (Mac/Linux).
4. Install Modules: `pip install -r requirements.txt`.
5. Establish Database Config: Provide a `.env` file containing CLOUDINARY and GOOGLE variables.
6. Run Migrations: `python manage.py migrate`.
7. Boot Localhost: `python manage.py runserver`. (Defaults to `http://127.0.0.1:8000`)

### Next.js Frontend
1. Open terminal inside `/frontend`.
2. Execute Dependency Map: `npm install`.
3. Provide Context variables via `.env.local` linking frontend targets to the active Backend securely (`NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
4. Ignite Dev Environment: `npm run dev`. (Defaults to `http://localhost:3000`)

---

## 7. Environment Variables

### Backend (`backend/.env`)
```bash
# Integrates Django directly with Cloudinary for handling media bin data silently. 
# REQUIRED FOR PRODUCT UPLOADS
CLOUDINARY_CLOUD_NAME=YourCloudName
CLOUDINARY_API_KEY=YourCloudAPIKey
CLOUDINARY_API_SECRET=YourCloudAPISecret

# Necessary tokens to map Google Login Identity assertions accurately. 
# REQUIRED FOR OAUTH
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-secret-string
```

### Frontend (`frontend/.env.local`)
```bash
# Asserts the domain pathing resolving the backend data API endpoints natively.
# REQUIRED FOR FRONTEND TO OPERATE
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Passes local verification requests inside the React App identifying correct GCP Projects.
# REQUIRED FOR OAUTH
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 8. Known Pitfalls / Important Notes

- **Google Client Configurations:** The "Missing required parameter: client_id" Error 400 is almost exclusively caused by `NEXT_PUBLIC_GOOGLE_CLIENT_ID` resolving as `undefined`. Always remember to **restart `npm run dev`** whenever `.env.local` variables are updated locally, else the UI cache will reject logins.
- **i18n Key Exclusions:** Missing keys inside your JSON files (`en.json` / `ar.json`) will throw string literal placeholders (e.g. `auth.login_button`). Always ensure translation maps match precisely.
- **Permissions and CORS:** The backend explicitly isolates standard operations via URL parameters (like CSRF Trusted Origins in `settings.py`). Altering these blocks will immediately fracture the local-development bridge terminating React's ability to login.
- **File Upload Errors:** Cloudinary misconfiguration triggers silent HTTP 500 crashes while submitting items to a storefront. Confirm CLOUDINARY dependencies are populated before writing structural `POST /products/` requests.

---

## 9. How to Safely Extend the Project

**Adding a New Next.js Page:**
1. Navigate directly inside `frontend/src/app/[locale]/`.
2. Produce a sub-directory representing the URL namespace (e.g. `warranty/`).
3. Embed an immutable `page.tsx` file inside it. Use `export default function WarrantyPage()` architecture.
4. Bind it natively using `<Link href="/warranty">` from navigation files.

**Generating a New Django Endpoint:**
1. Navigate to `api/models.py` generating database representations and execute `python manage.py makemigrations` and `migrate`.
2. Formulate serializers (`api/serializers.py`).
3. Formulate logic via generic Django `ViewSet`s (`api/views.py`).
4. Register the payload mapping linking the domain suffix via DefaultRouter (`api/urls.py`).

**Adding New Translations:**
Extrapolate JSON key layers symmetrically within BOTH `frontend/src/messages/en.json` AND `ar.json`. Always preserve uniform trailing paths preventing Next-Intl runtime breaks. Modifying dictionary shape without populating its AR counterpart risks server rendering glitches.

---

## 10. Developer Tips

- **Fetch Caching Awareness:** To combat Next.js severe hydration caches, you must structure user-based dynamic fetching within `@client` scopes preventing static renders caching incorrect login states persistently.
- **Consistent Typings:** Do not omit TypeScript variables. Align interfaces inside `frontend/src/types` perfectly mirroring `ModelSerializer` outputs preventing structural drift across the client boundary.
- **Don't touch `api.ts` blindly:** The centralized API fetch wrapper is highly sensitive. Intersecting headers explicitly or ignoring CSRF assertions will block data-writes globally, destroying Form operations.
- **RTL Testing Native:** Always test structural CSS modifiers simulating Right-To-Left shifts. Hardcoded styling parameters like `margin-left: 10px;` will shatter the Arabic interface structurally. Utilize `ms-4` (margin-start) executing symmetric logic inherently instead.

Enjoy building upon AutoParts Hub!
