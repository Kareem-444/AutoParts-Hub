# AutoParts Hub: Comprehensive Project Documentation

## 1. Project Overview
- **Name**: AutoParts Hub
- **Description**: A full-stack e-commerce marketplace dedicated to car spare parts. It connects buyers with trusted sellers worldwide, offering original equipment manufacturer (OEM) and aftermarket products.
- **Purpose**: To provide a seamless, localized (English and Arabic), and secure platform for purchasing and selling auto parts.
- **Target Audience**: Car owners, mechanics, and auto parts retailers.

## 2. Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, TypeScript, `next-intl` (for i18n).
- **Backend**: Python 3.12, Django, Django REST Framework, Django Channels (WebSockets), Daphne.
- **Database**: SQLite (currently used for development, easily configurable to PostgreSQL).
- **Authentication**: JWT (JSON Web Token) with secure HttpOnly cookies and Google OAuth.
- **Deploy/Hosting**: TBD (Vercel/Netlify for frontend, Heroku/AWS/Render for backend).

## 3. Project Structure
```text
AutoParts-Hub/
├── backend/                  # Django Backend
│   ├── api/                  # Main Django app: logic, models, serializers, views, consumers, routing
│   ├── config/               # Django root: settings, asgi (Channels), urls
│   ├── manage.py             # Django execution script
│   └── requirements.txt      # Python dependencies (includes channels, daphne)
├── frontend/                 # Next.js Frontend
│   ├── public/               # Static assets (images, localized categories, UI)
│   ├── src/
│   │   ├── app/[locale]/     # Dynamic routing for i18n
│   │   ├── components/       # Reusable React components (Navbar, ChatSidePanel, Footer, ui/)
│   │   ├── context/          # Globally provided state context (Auth, Cart, Modal)
│   │   ├── i18n/             # next-intl configuration and routing
│   │   ├── lib/              # API clients and utilities (api.ts, imageUtils)
│   │   ├── messages/         # i18n JSON dictionaries (en.json, ar.json)
│   │   └── types/            # TypeScript interfaces
│   ├── next.config.ts        # Next.js and next-intl plugin config
│   └── package.json          # Node dependencies
└── README.md                 # Project Documentation
```

## 4. Pages & Routes
- `/[locale]/` - **Home**: Featured products, latest additions, categories overview.
- `/[locale]/search` - **Search & Browse**: Product search with filters.
- `/[locale]/products/[id]` - **Product Details**: Specific part details, reviews, add to cart.
- `/[locale]/checkout` - **Checkout**: Cart review and order placement.
- `/[locale]/profile` - **User Profile**: Order history, robust avatar uploads, and account settings.
- `/[locale]/seller` - **Seller Dashboard**: Manage products, view sales and statistics.
- `/[locale]/admin` - **Admin Panel**: Manage users, orders, and site data.
- `/[locale]/auth/login` - **Login**: User authentication.
- `/[locale]/auth/register` - **Register**: New user and seller onboarding.
- `/[locale]/messages` - **Messages Inbox**: Real-time chat list and active conversations.

## 5. Features
- **Internationalization**: Full AR/EN RTL/LTR support natively via `next-intl`.
- **Search & Filtering**: Query and browse items by compatibility, condition, and category.
- **Cart & Checkout**: Flexible session-based and database-synced shopping cart.
- **Real-time Buyer-Seller Chat**: Secure WebSocket-based messaging system with unread notifications.
- **Custom Google OAuth**: Fully translatable Google login flow with custom UI and profile completion.
- **LinkedIn-Style Profile Pages**: Enhanced dashboards allowing avatar uploads and integrated order history.
- **Global Professional Modal System**: Custom Context-driven UI intercepting dangerous actions replacing legacy browser alerts.
- **Responsive Skeleton Loaders**: Premium shimmer wireframes across Seller, Profile, and Product pages for seamless async transitions.
- **Robust Image Galleries**: Fixed aspect-ratio galleries seamlessly handling single and parallel image uploads without crop-distortion.
- **Full Multilingual Localization**: Complete RTL/LTR support for all UI elements (Navbar, Footer, Product Cards).
- **Reviews**: Product rating and collaborative feedback system.
- **Seller Dashboard**: Dedicated UI for sellers to process orders and list inventory.
- **Responsive Design**: Mobile-first grid layouts built on Tailwind CSS.

## 6. Database Schema
- **User**: `AbstractUser` extension with `is_seller`, `phone`, `address`, `avatar`.
- **Category**: Hierarchical categories (`parent` relation for sub-categories).
- **Product**: Spare part listing (`car_make`, `car_model`, `car_year`, `condition`, `stock`, `price`), linked to Category and User (Seller).
- **ProductImage**: Multiple images per Product.
- **Review**: Star rating (`1-5`) and comment, linked to Product and User.
- **Cart & CartItem**: Temporary holding object for user purchases.
- **Order & OrderItem**: Completed purchases capturing dynamic state and price snapshots.
- **SellerProfile**: Store name, description, and logo context.
- **Conversation & Message**: Real-time chat threads and messaging history.

## 7. Authentication & Authorization
- **Method**: DRF Token Authentication. Tokens are stored in the browser's `localStorage` and sent actively over the `Authorization: Token <token>` header.
- **Roles**:
  - **Buyer**: Can browse, add to cart, write reviews, and checkout.
  - **Seller**: Can do everything a buyer does + `is_seller=True` enables access to the Seller Dashboard for creating products and managing store orders.
  - **Admin**: `is_staff=True` grants access to platform metrics, user management, and core database administration.

## 8. API Endpoints
All endpoints are strictly affixed to the `/api` prefix.
- **Auth**: `POST /auth/login/`, `POST /auth/register/`, `GET /auth/me/`, `PATCH /auth/update_profile/`
- **Categories**: `GET /categories/`, `GET /categories/<slug>/`
- **Products**: `GET /products/`, `GET /products/<id>/`, `GET /products/featured/`, `GET /products/latest/`, `POST /products/`, `PATCH /products/<id>/`, `DELETE /products/<id>/`
- **Reviews**: `GET /products/<id>/reviews/`, `POST /products/<id>/reviews/`
- **Cart**: `GET /cart/`, `POST /cart/add_item/`, `POST /cart/update_item/`, `POST /cart/remove_item/`, `POST /cart/clear/`
- **Orders**: `GET /orders/`, `GET /orders/<id>/`, `POST /orders/`
- **Chat**: `GET /chat/conversations/`, `GET /chat/conversations/<id>/messages/`
- **Seller**: `GET /seller/`, `GET /seller/dashboard/`, `GET /seller/orders/`
- **Admin**: `GET /admin/users/`, `GET /admin/orders/`, `PATCH /admin/orders/<id>/`

## 9. Third-party Integrations
- *(Currently none implemented)*. Future integrations pipeline includes payment gateways (Stripe/PayPal), and scalable cloud media hosting solutions (AWS S3/Cloudinary).

## 10. Environment Variables
### Frontend (`frontend/.env.local`)
- `NEXT_PUBLIC_API_URL`

### Backend (`backend/.env`)
- `SECRET_KEY`
- `DEBUG`
- `ALLOWED_HOSTS`
- `DATABASE_URL` (Optional hook for PostgreSQL deployment)

## 11. Installation & Setup
### Backend Setup
1. `cd backend`
2. Create Python virtual environment: `python -m venv venv`
3. Activate:
   - Windows: `venv\Scripts\activate` 
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Migrate database: `python manage.py migrate`
6. Run the server: `python manage.py runserver`

### Frontend Setup
1. `cd frontend`
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Visit `http://localhost:3000`

## 12. Current Status
- **Done**: Core frontend and backend architecture, authentication, product browsing layouts, complete English/Arabic `next-intl` localization, LinkedIn-style profile dashboards, and Global Modal integrations.
- **In Progress**: Enhancing interactive UI data flows and optimizing media buckets.
- **Planned**: Integrating Stripe checkout gateways and configuring Next.js robust image optimization loaders.

## 13. Known Issues / Challenges
- Media serving currently leans on the dev Django server handler. Transitioning to scalable bucket pipelines is necessary to optimize production delivery.
- Token context relies on client-side JS `localStorage`. Shifting to Server `HttpOnly` cookie-based JWTs will dramatically strengthen security posture against XSS exploits.

## 14. Screenshots
> *(Screenshots to be added showing the Home Page, Arabic localized RTL View, and Checkout Cart processes).*
