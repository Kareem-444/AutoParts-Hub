"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { products, categories } from "@/lib/api";
import { Product, Category } from "@/types";
import ProductCard from "@/components/ProductCard";

function SearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams ? searchParams.get("q") : null;
  const initialCategory = searchParams ? searchParams.get("category") : null;
  const initialCondition = searchParams ? searchParams.get("condition") : null;

  const [results, setResults] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "");
  const [selectedCondition, setSelectedCondition] = useState(initialCondition || "");
  const [sortOrder, setSortOrder] = useState("");
  const [searchTerm, setSearchTerm] = useState(q || "");
  const [tempSearch, setTempSearch] = useState(q || "");

  // Load categories once
  useEffect(() => {
    categories.list().then(setCats).catch(console.error);
  }, []);

  // Run search when filters change
  useEffect(() => {
    async function performSearch() {
      setLoading(true);
      const params = new URLSearchParams();

      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category__slug", selectedCategory);
      if (selectedCondition) params.append("condition", selectedCondition);
      if (sortOrder) params.append("ordering", sortOrder);

      try {
        const data = await products.list(params.toString());
        // Depending on pagination backend logic:
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    performSearch();
  }, [searchTerm, selectedCategory, selectedCondition, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(tempSearch);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-surface border border-border rounded-xl p-5 sticky top-24">
            <h2 className="text-lg font-bold text-text mb-4">Filters</h2>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text mb-3">Search</h3>
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Keyword..."
                  value={tempSearch}
                  onChange={(e) => setTempSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background mb-2 focus:ring-primary focus:border-primary"
                />
                <button type="submit" className="w-full py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors">
                  Apply
                </button>
              </form>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text mb-3">Category</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === ""}
                    onChange={() => setSelectedCategory("")}
                    className="text-primary focus:ring-primary"
                  />
                  <span>All Categories</span>
                </label>
                {cats.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value={c.slug}
                      checked={selectedCategory === c.slug}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-semibold text-text mb-3">Condition</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                  <input
                    type="radio"
                    name="condition"
                    checked={selectedCondition === ""}
                    onChange={() => setSelectedCondition("")}
                    className="text-primary focus:ring-primary"
                  />
                  <span>Any Condition</span>
                </label>
                {["new", "used", "refurbished"].map((cond) => (
                  <label key={cond} className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                    <input
                      type="radio"
                      name="condition"
                      value={cond}
                      checked={selectedCondition === cond}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="capitalize">{cond}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <h1 className="text-2xl font-bold text-text">
              {searchTerm ? `Results for "${searchTerm}"` : selectedCategory ? "Category Results" : "All Products"}
              <span className="text-base font-normal text-text-muted ml-2">({results.length} items)</span>
            </h1>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-sm text-text-muted">Sort by:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-border rounded-lg bg-surface text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Best Match</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="-created_at">Newest Arrivals</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-surface border border-border rounded-xl h-80 animate-pulse">
                  <div className="h-48 bg-background-alt rounded-t-xl mb-4"></div>
                  <div className="px-4 space-y-3">
                    <div className="h-4 bg-background-alt rounded w-3/4"></div>
                    <div className="h-4 bg-background-alt rounded w-1/2"></div>
                    <div className="h-6 bg-background-alt rounded w-1/4 mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-border border-dashed rounded-xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-background-alt rounded-full flex items-center justify-center mb-4 text-text-muted">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text mb-2">No products found</h3>
              <p className="text-text-muted">Try adjusting your filters or search terms.</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setTempSearch("");
                  setSelectedCategory("");
                  setSelectedCondition("");
                }}
                className="mt-6 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-surface transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
