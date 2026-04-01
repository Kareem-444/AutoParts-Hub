# Tasks & Progress

## Task 1: Real-time Buyer-Seller Chat System
- [x] **Backend: Setup**
  - [x] Add `channels`, `daphne` to `requirements.txt`
  - [x] Update `config/settings.py` (`INSTALLED_APPS`, `ASGI_APPLICATION`, `CHANNEL_LAYERS`)
  - [x] Update `config/asgi.py` (ProtocolTypeRouter, JWTAuth)
- [x] **Backend: Models & API**
  - [x] Create `Conversation` and `Message` models in `api/models.py`
  - [x] Create serializers in `api/serializers.py`
  - [x] Create views in `api/views.py`
  - [x] Add URLs in `api/urls.py`
  - [x] Run migrations
- [x] **Backend: WebSockets**
  - [x] Create `api/consumers.py`
  - [x] Create `api/routing.py`
- [x] **Frontend: Chat Side Panel**
  - [x] Create `ChatSidePanel.tsx`
  - [x] Update `[id]/page.tsx` with "Chat with Seller" button
  - [x] Add `chat` APIs to `api.ts`
- [x] **Frontend: Messages Inbox**
  - [x] Create `[locale]/messages/page.tsx`
  - [x] Add Messages tab in Seller Dashboard
  - [x] Add Messages link with unread count in Navbar
- [x] **Translations: Add to both en.json and ar.json**
  - [x] `chat.open_chat`
  - [x] `chat.send`, `chat.placeholder`, `chat.messages`
  - [x] Connection state keys

## Task 2: Google Login Button Translation
- [x] Custom `useGoogleLogin` wrapper in `GoogleLoginButton.tsx`
- [x] Remove old `<GoogleLogin>` component
- [x] Support `access_token` in backend Django views
- [x] Add translations for `auth.continue_with_google`

## Task 3: Missing Arabic Translations
- [x] Find hardcoded English strings across `frontend/src/app` & `components`
- [x] Replace with next-intl keys (Navbar, Footer, ProductCard)
- [x] Add corresponding `ar.json` and `en.json` translations

## Wrap up
- [ ] Verify functionality
- [ ] Create `WALKTHROUGH.md`
- [ ] Git commit and push
