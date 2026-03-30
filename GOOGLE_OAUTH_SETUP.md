# Google OAuth Setup Guide

To enable Google sign-in for the AutoParts Hub application, follow these steps to configure a project in the Google Cloud Console.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click on the project drop-down menu in the top-left and select **New Project**.
3. Name your project (e.g., "AutoParts Hub OAuth") and click **Create**.

## 2. Configure OAuth Consent Screen
1. In the sidebar menu, navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** (if you want any Google user to be able to sign in) and click **Create**.
3. Fill out the application details:
   - **App name**: AutoParts Hub
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
   - Leave scopes empty for now (the app requests email & profile dynamically).
4. Save and continue.

## 3. Create Credentials
1. Navigate to **APIs & Services > Credentials** on the sidebar.
2. Click **Create Credentials** and select **OAuth client ID**.
3. Choose **Web application** from the Application type.
4. Name the client (e.g., "Web App Client").

### 4. Setup Domains and Redirects
*Authorized JavaScript origins configuration is crucial to prevent CORS origin mismatch.*

Add the following to **Authorized JavaScript origins**:
- `http://localhost:3000` (for local development)
- `http://127.0.0.1:3000` (optional local alternative)
- `https://your-vercel-app.vercel.app` (your production frontend URL)

Add the following to **Authorized redirect URIs**:
- `http://localhost:3000` 
- `https://your-vercel-app.vercel.app`

Click **Create**.

## 5. Add Credentials to Environment Variables
Once created, Google will display your Client ID and Client Secret.

Copy the **Client ID** into the frontend environment (`frontend/.env`):
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Copy both the **Client ID** and **Client Secret** into the backend environment (`backend/.env`):
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-string
```

> **Note**: For security, NEVER commit the `.env` file to your repository.

Restart both your Django server and your Next.js application, and you'll be able to log in securely with Google.
