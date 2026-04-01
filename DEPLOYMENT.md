# 🚀 AutoParts Hub Deployment Guide

Follow these steps to deploy **AutoParts Hub** to production using **Railway** (Backend & Database) and **Vercel** (Frontend).

---

## 📋 Pre-Deployment Checklist
- [ ] Cloudinary Account & Credentials (`CLOUD_NAME`, `API_KEY`, `API_SECRET`)
- [ ] Google Cloud Console project with OAuth 2.0 Credentials
- [ ] Groq API Key for Aria Assistant
- [ ] Railway.app Account
- [ ] Vercel.com Account
- [ ] GitHub Repository with latest code pushed

---

## 🐘 Step 1: Provision Railway PostgreSQL
1.  Log in to [railway.app](https://railway.app).
2.  Click **"New Service"** → **"Database"** → **"Add PostgreSQL"**.
3.  Once provisioned, click on the PostgreSQL service.
4.  Go to the **"Variables"** tab and copy the `DATABASE_URL`. (Railway will automatically inject this into linked services, but keep it handy).

---

## 🐍 Step 2: Deploy Django Backend on Railway
1.  Click **"New Service"** → **"GitHub Repo"** → Select your repository.
2.  Set **Root Directory** to `backend`.
3.  Go to the **"Variables"** tab and add the following:

### Required Railway Environment Variables:
| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `SECRET_KEY` | Django secret key | Generate a random 50-char string |
| `DATABASE_URL` | PostgreSQL connection string | (Auto-set by linking PostgreSQL) |
| `ALLOWED_HOSTS` | Domains allowed to access backend | `your-backend.railway.app,api.yourdomain.com` |
| `CORS_ALLOWED_ORIGINS` | Frontend domains for API access | `https://your-app.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Frontend domains for CSRF safety | `https://your-app.vercel.app` |
| `DJANGO_SETTINGS_MODULE` | Point to production settings | `config.settings_production` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary name | From Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | From Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | From Cloudinary Dashboard |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | From Google Cloud Console |
| `PORT` | Networking port | `8000` |

### 🛠️ Run Migrations
After the first successful deployment:
1.  Go to your Backend service in Railway.
2.  Click **"Settings"** → **"Deploy"**.
3.  Scroll to **"Custom Command"** or use the **"View Logs"** → **"Terminal"** tab.
4.  Run: `python manage.py migrate`

---

## ⚛️ Step 3: Deploy Next.js Frontend on Vercel
1.  Log in to [vercel.com](https://vercel.com).
2.  Click **"Add New"** → **"Project"** → Import your GitHub repository.
3.  Set **Root Directory** to `frontend`.
4.  Set **Framework Preset** to **Next.js**.
5.  Add the following **Environment Variables**:

### Required Vercel Environment Variables:
| Variable | Description | Example / Note |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Your Railway Backend URL | `https://your-backend.railway.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth ID | (Same as backend) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary name | (Same as backend) |
| `NEXT_PUBLIC_GROQ_API_KEY` | Groq AI Key | From console.groq.com |

6.  Click **"Deploy"**.

---

## 🧪 Step 4: Post-Deployment Testing
- [ ] Visit Vercel URL → Home page loads with Skeleton Loaders.
- [ ] Register a new account.
- [ ] Login with Email/Password.
- [ ] Login with Google OAuth.
- [ ] Search for products & use filters.
- [ ] Add products to cart & proceed to checkout.
- [ ] Open **Aria AI Assistant** and ask a question.
- [ ] Open real-time chat with a seller.
- [ ] **Seller**: Upload a new product image (verify it goes to Cloudinary).
- [ ] Check browser console for any CORS or Mixed Content errors.

---

## 🔐 Step 5: Finalize Google OAuth Settings
Once you have your **Vercel Production URL**:
1.  Go to [console.cloud.google.com](https://console.cloud.google.com).
2.  **APIs & Services** → **Credentials** → Edit your OAuth 2.0 Client.
3.  Add your Vercel URL to **Authorized JavaScript origins**:
    - `https://your-app.vercel.app`
4.  Add your Vercel URL to **Authorized redirect URIs**:
    - `https://your-app.vercel.app` (and any custom domain)

> [!CAUTION]
> Ensure `SECURE_SSL_REDIRECT = True` remains set in `settings_production.py` to enforce HTTPS across the entire stack.
