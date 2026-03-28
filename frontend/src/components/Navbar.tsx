"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { User } from "@/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
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

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-8">
            <div className="flex w-full">
              <input
                type="text"
                placeholder="Search car parts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-primary-light bg-background"
              />
              <button
                type="submit"
                className="px-5 py-2 bg-primary text-white rounded-r-lg hover:bg-primary-dark transition-colors text-sm font-medium"
              >
                Search
              </button>
            </div>
          </form>

          <nav className="hidden md:flex items-center gap-1">
            <Link href="/search" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
              Browse
            </Link>
            {user ? (
              <>
                {user.is_seller && (
                  <Link href="/seller" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
                    Seller Dashboard
                  </Link>
                )}
                {user.is_staff && (
                  <Link href="/admin" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
                    Admin
                  </Link>
                )}
                <Link href="/checkout" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background relative">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </Link>
                <Link href="/profile" className="px-3 py-2 text-sm text-text-muted hover:text-primary transition-colors rounded-md hover:bg-background">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
                <button onClick={handleLogout} className="px-3 py-2 text-sm text-error hover:bg-red-50 transition-colors rounded-md">
                  Logout
                </button>
              </>
            ) : (
              <Link href="/auth/login" className="ml-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">
                Sign In
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
            <form onSubmit={handleSearch} className="flex mb-3">
              <input
                type="text"
                placeholder="Search car parts…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 border border-border rounded-l-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-light bg-background"
              />
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-r-lg text-sm font-medium">
                Search
              </button>
            </form>
            <Link href="/search" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">
              Browse All Parts
            </Link>
            {user ? (
              <>
                <Link href="/checkout" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">Cart</Link>
                <Link href="/profile" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">My Profile</Link>
                {user.is_seller && (
                  <Link href="/seller" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">Seller Dashboard</Link>
                )}
                {user.is_staff && (
                  <Link href="/admin" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-text-muted hover:text-primary rounded-md">Admin Panel</Link>
                )}
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-sm text-error hover:bg-red-50 rounded-md">Logout</button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm font-medium text-primary hover:bg-blue-50 rounded-md">Sign In</Link>
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
