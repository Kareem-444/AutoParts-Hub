"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { categories, products } from "@/lib/api";
import { Category, Product } from "@/types";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import { useTranslations } from "next-intl";

export default function Home() {
  const t = useTranslations("Home");
  const tCommon = useTranslations("Common");
  
  const [cats, setCats] = useState<Category[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [latest, setLatest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, f, l] = await Promise.all([
          categories.list(),
          products.featured(),
          products.latest(),
        ]);
        setCats(c);
        setFeatured(f);
        setLatest(l.slice(0, 4)); // Show only 4 latest
      } catch (err: any) {
        setError("Failed to load marketplace data. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-100 text-error rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text mb-2">{tCommon("connectionError")}</h2>
        <p className="text-text-muted">{error}</p>
        <p className="text-sm text-text-light mt-4">{tCommon("serverStartPrompt")} <code>python manage.py runserver</code></p>
      </div>
    );
  }

  return (
    <div className="pb-16 bg-background">
      {/* Hero Banner */}
      <section className="bg-primary text-white py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary-dark to-primary relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              {t("heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-lg">
              {t("heroSubtitle")}
            </p>
            <div className="flex gap-4">
              <Link
                href="/search"
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-background-alt transition-colors shadow-sm"
              >
                {t("shopNow")}
              </Link>
              <Link
                href="/auth/register"
                className="bg-primary-light bg-opacity-30 text-white border border-white border-opacity-30 px-8 py-3 rounded-lg font-semibold hover:bg-opacity-40 transition-colors hidden sm:block"
              >
                {t("becomeSeller")}
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            {/* Visual element instead of missing image */}
            <div className="w-full h-64 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 flex flex-col justify-center gap-4 border-dashed">
              <div className="w-3/4 h-8 bg-white/20 rounded-md"></div>
              <div className="w-1/2 h-8 bg-white/20 rounded-md"></div>
              <div className="w-full h-8 bg-white/20 rounded-md"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-text">{t("shopByCategory")}</h2>
          <Link href="/search" className="text-sm font-medium text-primary hover:text-primary-dark">
            {t("viewAllCategories")}
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
          {cats.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <h2 className="text-2xl font-bold text-text mb-8">{t("featuredProducts")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featured.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}

      {/* Trust factors */}
      <section className="bg-surface py-16 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="px-4">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">{t("verifiedSellers")}</h3>
              <p className="text-text-muted text-sm px-4">{t("verifiedSellersDesc")}</p>
            </div>
            <div className="px-4">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">{t("securePayments")}</h3>
              <p className="text-text-muted text-sm px-4">{t("securePaymentsDesc")}</p>
            </div>
            <div className="px-4">
              <div className="w-12 h-12 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">{t("easyReturns")}</h3>
              <p className="text-text-muted text-sm px-4">{t("easyReturnsDesc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      {latest.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
          <h2 className="text-2xl font-bold text-text mb-8">{t("justAdded")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {latest.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
