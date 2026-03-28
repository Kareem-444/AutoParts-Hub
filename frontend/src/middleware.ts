import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { decodeJwt } from "jose";

// next-intl middleware instance
const intlMiddleware = createIntlMiddleware(routing);

// Routes that require authentication (relative to /[locale])
const PROTECTED_PATHS = ["/checkout", "/profile", "/seller", "/admin"];

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
    const refreshToken = request.cookies.get("refresh_token")?.value;

    // No refresh token → redirect to login
    if (!refreshToken) {
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Decode JWT to check role claims (no verification needed —
    // the backend will reject invalid tokens on API calls)
    try {
      const payload = decodeJwt(refreshToken) as JWTPayload;

      // Check if token is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        const loginUrl = new URL(`/${locale}/auth/login`, request.url);
        loginUrl.searchParams.set("redirect", pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete("refresh_token");
        return response;
      }

      // Seller route but user is not a seller
      if (isSellerPath(pathname, locale) && !payload.is_seller) {
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }

      // Admin route but user is not staff
      if (isAdminPath(pathname, locale) && !payload.is_staff) {
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    } catch {
      // Invalid token format — redirect to login
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("redirect", pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("refresh_token");
      return response;
    }
  }

  // Let next-intl handle the request for i18n
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
