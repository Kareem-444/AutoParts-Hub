"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { cart } = useCart();
  const { user, logout } = useAuth();
  const cartItemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const [unreadMessages, setUnreadMessages] = useState(0);

  const searchParams = useSearchParams();
  const t = useTranslations("Search");
  const navT = useTranslations("Navigation");
  const authT = useTranslations("Common");
  const sellerT = useTranslations("Seller");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      import('@/lib/api').then(({ chat }) => {
        chat.getConversations().then(data => {
          const totalUnread = data.reduce((sum, conv) => sum + conv.unread_count, 0);
          setUnreadMessages(totalUnread);
        }).catch(() => {});
      });
    }
  }, [user]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="bg-surface border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-xl font-bold text-primary hidden sm:block">AutoParts Hub</span>
          </Link>

          <div className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="flex w-full">
              <input
                type="text"
                placeholder={t("placeholder")}
                value={searchQuery}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light bg-background"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="px-5 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                {t("apply")}
              </button>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/search" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
              {navT("browse") || "Browse"}
            </Link>
            {user ? (
              <>
                {user.is_seller && (
                  <Link href="/seller" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
                    {sellerT("dashboard") || "Seller Dashboard"}
                  </Link>
                )}
                {user.is_staff && (
                  <Link href="/admin" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
                    {navT("adminPanel") || "Admin"}
                  </Link>
                )}
                <Link href="/messages" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background relative" title={navT("messages") || "Messages"}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                  {unreadMessages > 0 && (
                    <span className="absolute top-0 right-0 bg-error text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <Link href="/checkout" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                  {cartItemCount > 0 && (
                    <span className="absolute top-0 right-0 bg-error text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 text-sm text-error hover:bg-red-50 transition-colors rounded-md">
                  {authT("logout") || "Logout"}
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="ml-2 rtl:ml-0 rtl:mr-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
                {authT("signIn") || "Sign In"}
              </Link>
            )}
            <div className="ml-4 border-l border-border pl-4 hidden md:block">
              <LanguageSwitcher />
            </div>
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-md hover:bg-background text-text-muted cursor-pointer">
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-3">
            <div className="flex mb-3">
              <input
                type="text"
                placeholder={t("placeholder")}
                value={searchQuery}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light bg-background"
              />
              <button type="button" onClick={handleSearch} className="px-4 py-2 bg-primary text-white rounded-r-lg text-sm font-medium">
                {t("apply")}
              </button>
            </div>
            <Link href="/search" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">
              {navT("browseAllParts") || "Browse All Parts"}
            </Link>
            {user ? (
              <>
                <Link href="/checkout" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">
                  <span>{navT("cart") || "Cart"}</span>
                  {cartItemCount > 0 && (
                    <span className="bg-error text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {cartItemCount}
                    </span>
                  )}
                </Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">{navT("myProfile") || "My Profile"}</Link>
                {user.is_seller && (
                  <Link href="/seller" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">{sellerT("dashboard") || "Seller Dashboard"}</Link>
                )}
                {user.is_staff && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">{navT("adminPanel") || "Admin Panel"}</Link>
                )}
                <Link href="/messages" onClick={() => setMenuOpen(false)} className="flex items-center justify-between px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">
                  <span>{navT("messages") || "Messages"}</span>
                  {unreadMessages > 0 && (
                    <span className="bg-error text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-error hover:bg-red-50 rounded-md">{authT("logout") || "Logout"}</button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-md">{authT("signIn") || "Sign In"}</Link>
            )}
            <div className="mt-4 pt-4 border-t border-border">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
