import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { decodeJwt } from "jose";

// next-intl middleware instance
const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication (relative to /[locale])
const PROTECTED_PATHS = ["/checkout", "/profile", "/dashboard", "/seller", "/admin"];

// Routes that require specific roles
const SELLER_PATHS = ["/seller"];
const ADMIN_PATHS = ["/admin"];

function getLocaleFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/(en|ar)(\/|$)/);
  return match ? match[1] : null;
}

function isProtectedPath(pathname: string, locale: string): boolean {
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  return PROTECTED_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
}

function isSellerPath(pathname: string, locale: string): boolean {
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  return SELLER_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
}

function isAdminPath(pathname: string, locale: string): boolean {
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";
  return ADMIN_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  );
}

interface JWTPayload {
  user_id?: number;
  username?: string;
  is_seller?: boolean;
  is_staff?: boolean;
  exp?: number;
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const locale = getLocaleFromPath(pathname);

  // Let next-intl handle non-locale paths and redirects
  if (!locale) {
    return intlMiddleware(request);
  }

  // Check if this is a protected route
  if (isProtectedPath(pathname, locale)) {
    // 'auth_session' is a lightweight cookie set by the Next.js frontend
    // after a successful login/refresh. We cannot use 'refresh_token' here
    // because that cookie is set by the Django backend domain and the browser
    // only sends it to that domain — NOT to the Next.js (Vercel) domain.
    const authSession = request.cookies.get("auth_session")?.value;

    if (!authSession) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based checks: we still decode the refresh_token if present
    // (it may exist if Django and Next.js share the same domain, e.g. local dev)
    // but we do NOT block access purely based on its absence.
    const refreshToken = request.cookies.get("refresh_token")?.value;
    if (refreshToken) {
      try {
        const payload = decodeJwt(refreshToken) as JWTPayload;

        // Seller route but user is not a seller
        if (isSellerPath(pathname, locale) && !payload.is_seller) {
          return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }

        // Admin route but user is not staff
        if (isAdminPath(pathname, locale) && !payload.is_staff) {
          return NextResponse.redirect(new URL(`/${locale}`, request.url));
        }
      } catch {
        // Token decode failed — still allow access; the backend will reject bad tokens
      }
    }
  }

  // Let next-intl handle the request for i18n
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
