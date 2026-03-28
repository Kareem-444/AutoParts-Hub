"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { products as productsApi, PaginatedResponse } from "@/lib/api";
import { Product } from "@/types";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import Pagination from "@/components/Pagination";

export default function SearchClient() {
  const t = useTranslations("Search");
  const searchParams = useSearchParams();
  
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    let active = true;
    
    const params = new URLSearchParams(searchParams.toString());
    const q = params.get("q");
    
    if (q) {
      params.set("search", q);
      params.delete("q");
    }

    const fetchResults = async () => {
      if (data) setIsRefetching(true);
      else setLoading(true);

      try {
        const res = await productsApi.search(params.toString());
        if (active) {
          setData(res);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        if (active) {
          setLoading(false);
          setIsRefetching(false);
        }
      }
    };

    fetchResults();

    return () => {
      active = false;
    };
  }, [searchParams]);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    );
  }

  const results = data?.results || [];
  const searchQuery = searchParams.get("q");

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text">
          {data?.count || 0} {searchQuery ? t("resultsFor") + ` "${searchQuery}"` : t("results")}
        </h2>
      </div>

      <div className={`relative transition-opacity duration-200 ${isRefetching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        
        {isRefetching && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-md"></span>
          </div>
        )}

        {results.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
              <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-text mb-2">{t("noResults")}</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {data && data.count > 0 && (
          <Pagination count={data.count} />
        )}
      </div>
    </>
  );
}
