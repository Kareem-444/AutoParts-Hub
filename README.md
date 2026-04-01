# 🚗 AutoParts Hub — Modern Automotive Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Django](https://img.shields.io/badge/Django-5.1-092e20)](https://www.djangoproject.com/)
[![WebSockets](https://img.shields.io/badge/WebSockets-Enabled-blue)](https://channels.readthedocs.io/)
[![Groq](https://img.shields.io/badge/AI_Assistant-Aria-orange)](https://groq.com/)

**AutoParts Hub** is a feature-rich, high-performance marketplace designed specifically for car spare parts. It bridges the gap between individual sellers, professional dealers, and car owners through a seamless, multilingual, and real-time experience.

---

## 🌟 Key Features

### 🛒 High-Performance Commerce
- **Advanced Search & Filtering**: URL-driven search allowing instantaneous filtering by category, car make, model, year, and condition.
- **Global Cart & Checkout**: Secure shopping cart system with localized checkout and order history.
- **Seller Dashboard**: Comprehensive tools for sellers to list products, upload multiple images via Cloudinary, and track store statistics.

### 💬 Real-Time Interaction
- **Instant Chat**: WebSocket-powered messaging between buyers and sellers directly on the platform.
- **Notification System**: Live unread message badges integrated into the navbar and dashboard.
- **Aria AI Assistant**: Your intelligent automotive support agent, powered by Groq (Llama 3.3). Aria provides context-aware guidance and multilingual support.

### 🔐 Secure & Modern Core
- **Dual Authentication**: Local email/password + Google OAuth 2.0 with intermediate profile completion.
- **Secure JWT Flow**: Token-based authentication using **HttpOnly cookies** for refresh-token rotation (zero localStorage risk).
- **Internationalization (i18n)**: Full English (LTR) and Arabic (RTL) support with automatic locale detection and layout shifting.
- **Premium UI/UX**: Shimmer skeleton loaders for every dynamic page, global modal system for alerts/confirmations, and a fully responsive dark-themed aesthetic.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4, next-intl, Framer Motion |
| **Backend** | Django 5.1, Django REST Framework, Django Channels 4.0, Daphne (ASGI) |
| **Database** | SQLite (Development) / PostgreSQL (Production) |
| **Storage** | Cloudinary (CDN for images & avatars) |
| **Real-Time** | WebSockets via Django Channels & InMemoryChannelLayer |
| **AI** | Groq Cloud API (Llama 3.3 70B Versatile) |
| **Auth** | SimpleJWT (HttpOnly rotation), Google OAuth v2 |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- Cloudinary Account (for images)
- Google Cloud Project (for OAuth)

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | Unix: source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 📋 Environment Variables

### Backend (`backend/.env`)
```bash
SECRET_KEY=your-django-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
GOOGLE_CLIENT_ID=your-google-id
GOOGLE_CLIENT_SECRET=your-google-secret
```

### Frontend (`frontend/.env.local`)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-id
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_GROQ_API_KEY=your-groq-key (Aria Assistant)
```

---

## 🔒 Security Note
This project implements **HttpOnly Cookie-based JWT rotation**. The `refresh_token` is never accessible via JavaScript, preventing XSS-based token theft. Authorization is handled via an ephemeral in-memory `access_token`.

---

## 📄 License
This project is licensed under the MIT License.
