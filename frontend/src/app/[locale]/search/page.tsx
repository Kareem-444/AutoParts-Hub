import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import SearchClient from "./SearchClient";
import FiltersPanel from "@/components/FiltersPanel";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const unwrappedParams = await params;
  const t = await getTranslations({ locale: unwrappedParams.locale, namespace: "Search" });

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-extrabold text-text tracking-tight">{t("placeholder").replace("...", "")}</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Filters Sidebar */}
          <Suspense fallback={<div className="w-64 shrink-0 bg-surface rounded-xl h-96 animate-pulse border border-border"></div>}>
            <FiltersPanel />
          </Suspense>

          {/* Search Results Grid */}
          <div className="flex-1 w-full relative">
            <Suspense fallback={
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            }>
              <SearchClient />
            </Suspense>
          </div>
        </div>
        
      </div>
    </div>
  );
}
