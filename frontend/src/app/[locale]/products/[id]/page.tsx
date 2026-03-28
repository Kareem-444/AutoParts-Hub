"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { products, cart, reviews as reviewsApi } from "@/lib/api";
import { Product, Review, Category } from "@/types";
import StarRating from "@/components/StarRating";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviewsList] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Review form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProduct() {
      try {
        const [prod, revs] = await Promise.all([
          products.get(id),
          reviewsApi.list(id),
        ]);
        setProduct(prod);
        setActiveImage(prod.primary_image || null);
        setReviewsList(revs);
      } catch (err: any) {
        setError("Could not load product details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!localStorage.getItem("token")) {
      router.push(`/auth/login?redirect=/products/${id}`);
      return;
    }
    setAddingToCart(true);
    try {
      await cart.addItem(Number(id), quantity);
      alert("Added to cart!");
    } catch (err: any) {
      alert("Error adding to cart: " + err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localStorage.getItem("token")) {
      router.push(`/auth/login?redirect=/products/${id}`);
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const newRev = await reviewsApi.create(id, { rating, comment });
      setReviewsList([newRev, ...reviews]);
      setComment("");
      setRating(5);
    } catch (err: any) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-1/2 h-96 bg-surface border border-border rounded-xl"></div>
          <div className="w-full md:w-1/2 space-y-4">
            <div className="h-8 bg-surface rounded w-3/4"></div>
            <div className="h-4 bg-surface rounded w-1/4"></div>
            <div className="h-6 bg-surface rounded w-1/5 mt-6"></div>
            <div className="h-24 bg-surface rounded w-full mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-text mb-4">Product Not Found</h2>
        <p className="text-text-muted mb-8">{error}</p>
        <button onClick={() => router.back()} className="px-6 py-2 bg-primary text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-text-muted mb-8" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/" className="hover:text-primary transition-colors">Home</a>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </li>
          <li>
            <a href={`/search?category=${(product.category as Category)?.slug || ""}`} className="hover:text-primary transition-colors">
              {product.category_name || "Category"}
            </a>
          </li>
          <li>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </li>
          <li className="text-text truncate max-w-xs">{product.title}</li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Images section */}
        <div className="w-full md:w-1/2 shrink-0">
          <div className="bg-surface border border-border rounded-2xl overflow-hidden aspect-[4/3] mb-4">
            {activeImage ? (
              <img src={activeImage} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-light">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {product.images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.image)}
                  className={`w-20 h-20 shrink-0 border-2 rounded-lg overflow-hidden ${
                    activeImage === img.image ? "border-primary" : "border-border hover:border-text-muted"
                  }`}
                >
                  <img src={img.image} alt={img.alt_text} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="w-full md:w-1/2 flex flex-col">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-background-alt text-text-muted text-xs font-semibold rounded-full uppercase tracking-wider mb-3">
              {product.condition}
            </span>
            <h1 className="text-3xl font-extrabold text-text tracking-tight mb-2">{product.title}</h1>

            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1">
                <StarRating rating={product.average_rating} size="md" />
                <span className="text-sm font-medium text-text ml-1">{product.average_rating}</span>
                <span className="text-sm text-text-muted ml-1">({product.review_count} reviews)</span>
              </div>
              <span className="text-border-dark">|</span>
              <span className="text-sm text-text-muted font-medium">Part Code: #{product.id.toString().padStart(6, "0")}</span>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex flex-col">
              <span className="text-4xl font-extrabold text-primary">${Number(product.price).toFixed(2)}</span>
              <span className="text-sm text-text-light mt-1">+ Free Shipping</span>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl p-5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 text-primary rounded-full flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text">Vehicle Fitment</h3>
                <p className="text-sm text-text-muted">
                  {product.car_make || "Universal"} {product.car_model} {product.car_year && `(${product.car_year})`}
                </p>
              </div>
            </div>
            {(product.seller_profile || product.seller_name) && (
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 bg-background-alt text-text-muted rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-text">Sold by</h3>
                  <p className="text-sm text-text-muted">
                    {product.seller_profile?.store_name || product.seller_name}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart Actions */}
          <div className="mt-auto flex flex-col sm:flex-row gap-4">
            <div className="flex items-center border border-border rounded-xl h-14 bg-surface w-full sm:w-32 shrink-0">
              <button
                className="w-10 h-full flex justify-center items-center text-text-muted hover:text-text"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                className="flex-1 w-full text-center font-semibold text-text focus:outline-none bg-transparent"
              />
              <button
                className="w-10 h-full flex justify-center items-center text-text-muted hover:text-text"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              >
                +
              </button>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock < 1}
              className={`flex-1 h-14 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm transition-colors ${
                product.stock < 1 
                  ? "bg-background-alt text-text-muted cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-dark active:bg-blue-900"
              }`}
            >
              {addingToCart ? "Adding..." : product.stock < 1 ? "Out of Stock" : "Add to Cart"}
            </button>
          </div>
          {product.stock > 0 && product.stock < 5 && (
            <p className="text-error text-sm font-medium mt-3 text-center sm:text-left">
              Hurry! Only {product.stock} left in stock.
            </p>
          )}
        </div>
      </div>

      {/* Description & Reviews Tabs */}
      <div className="mt-16 border-t border-border pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Description */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-text mb-6">Product Description</h2>
            <div className="prose prose-blue max-w-none text-text-muted leading-relaxed">
              <p className="whitespace-pre-line">{product.description}</p>
            </div>
          </div>

          {/* Reviews */}
          <div>
            <h2 className="text-2xl font-bold text-text mb-6">Customer Reviews</h2>
            
            {/* Review Form */}
            <form onSubmit={handleSubmitReview} className="mb-8 bg-surface p-5 rounded-xl border border-border">
              <h3 className="font-semibold text-sm mb-3">Write a review</h3>
              {reviewError && <p className="text-error text-xs mb-2">{reviewError}</p>}
              <div className="mb-3">
                <StarRating rating={rating} size="lg" onChange={setRating} />
              </div>
              <textarea
                rows={3}
                placeholder="Share your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2 bg-text text-background rounded-lg text-sm font-medium hover:bg-black transition-colors"
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>

            {/* Review List */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <p className="text-text-muted text-sm italic">No reviews yet. Be the first!</p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-border pb-4 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm text-text">{rev.user?.username}</span>
                      <span className="text-xs text-text-light">{new Date(rev.created_at).toLocaleDateString()}</span>
                    </div>
                    <StarRating rating={rev.rating} size="sm" />
                    {rev.comment && <p className="mt-2 text-sm text-text-muted">{rev.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
