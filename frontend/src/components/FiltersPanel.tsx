"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/routing";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { categories as categoriesApi } from "@/lib/api";
import { Category } from "@/types";

export default function FiltersPanel() {
  const t = useTranslations("Search");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Local state for debounced inputs
  const [carMake, setCarMake] = useState(searchParams.get("car_make") || "");
  const [carModel, setCarModel] = useState(searchParams.get("car_model") || "");
  const [carYear, setCarYear] = useState(searchParams.get("car_year") || "");

  useEffect(() => {
    categoriesApi.list().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    setCarMake(searchParams.get("car_make") || "");
    setCarModel(searchParams.get("car_model") || "");
    setCarYear(searchParams.get("car_year") || "");
  }, [searchParams]);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    const q = searchParams.get("q"); 
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setIsMobileOpen(false);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      let changed = false;
      
      const currentMake = searchParams.get("car_make") || "";
      if (carMake !== currentMake && (carMake || currentMake)) {
        if (carMake) params.set("car_make", carMake); else params.delete("car_make");
        changed = true;
      }
      
      const currentModel = searchParams.get("car_model") || "";
      if (carModel !== currentModel && (carModel || currentModel)) {
        if (carModel) params.set("car_model", carModel); else params.delete("car_model");
        changed = true;
      }
      
      const currentYear = searchParams.get("car_year") || "";
      if (carYear !== currentYear && (carYear || currentYear)) {
        if (carYear) params.set("car_year", carYear); else params.delete("car_year");
        changed = true;
      }

      if (changed) {
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [carMake, carModel, carYear, pathname, router, searchParams]);

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-text">{t("filters")}</h2>
        <button onClick={clearFilters} className="text-sm font-medium text-primary hover:underline">
          {t("clearAll")}
        </button>
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-2">{t("sortBy")}</label>
        <select
          value={searchParams.get("ordering") || "-created_at"}
          onChange={(e) => updateParam("ordering", e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm hover:border-border transition-colors outline-none focus:ring-2 focus:ring-primary-light"
        >
          <option value="-created_at">{t("newest")}</option>
          <option value="price">{t("priceLowHigh")}</option>
          <option value="-price">{t("priceHighLow")}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-2">{t("categories")}</label>
        <select
          value={searchParams.get("category") || ""}
          onChange={(e) => updateParam("category", e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm hover:border-border transition-colors outline-none focus:ring-2 focus:ring-primary-light"
        >
          <option value="">{t("allCategories")}</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-3">{t("condition")}</label>
        <div className="space-y-3">
          {["", "new", "used", "refurbished"].map((cond) => (
            <label key={cond} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                name="condition"
                value={cond}
                checked={(searchParams.get("condition") || "") === cond}
                onChange={(e) => updateParam("condition", e.target.value)}
                className="w-4 h-4 text-primary focus:ring-primary border-border"
              />
              <span className="text-sm text-text font-medium capitalize group-hover:text-primary transition-colors">
                {cond === "" ? t("all") : t(cond as any)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-2">{t("carMake")}</label>
        <input
          type="text"
          value={carMake}
          onChange={(e) => setCarMake(e.target.value)}
          placeholder="e.g. Toyota"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-2">{t("carModel")}</label>
        <input
          type="text"
          value={carModel}
          onChange={(e) => setCarModel(e.target.value)}
          placeholder="e.g. Camry"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-text mb-2">{t("carYear")}</label>
        <input
          type="number"
          value={carYear}
          onChange={(e) => setCarYear(e.target.value)}
          placeholder="e.g. 2020"
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary-light"
        />
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden w-full mb-4 px-4 py-2 border border-border bg-surface rounded-lg text-sm font-bold flex items-center gap-2 justify-center shadow-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {t("filters")}
      </button>

      <div className="hidden md:block w-64 shrink-0">
        <div className="bg-surface border border-border rounded-xl p-5 sticky top-24 shadow-sm">
          <FilterContent />
        </div>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-[100] flex ltr:flex-row rtl:flex-row-reverse">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)}></div>
          <div className="relative w-80 max-w-full bg-surface h-full overflow-y-auto z-10 p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-text">{t("filters")}</h2>
              <button onClick={() => setIsMobileOpen(false)} className="p-2 text-text-muted hover:bg-background rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <FilterContent />
            </div>
            <div className="mt-6 pt-6 border-t border-border">
              <button
                onClick={() => setIsMobileOpen(false)}
                className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-dark transition-colors shadow-sm"
              >
                {t("apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
