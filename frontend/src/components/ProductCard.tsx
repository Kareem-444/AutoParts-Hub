import { Link } from "@/i18n/routing";
import { Product } from "@/types";
import StarRating from "./StarRating";
import { getImageUrl } from "@/lib/imageUtils";
import { useTranslations } from "next-intl";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations("Product");
  const imageUrl = getImageUrl(product.primary_image) || "/placeholder-car.jpg";
  const conditionColors: Record<string, string> = {
    new: "bg-green-100 text-green-800",
    used: "bg-amber-100 text-amber-800",
    refurbished: "bg-blue-100 text-blue-800",
  };

  return (
    <Link href={`/products/${product.id}`} className="group">
      <div className="bg-surface rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="aspect-[4/3] bg-background-alt relative overflow-hidden">
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-16 h-16 text-border-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          )}

          <span className={`absolute top-3 left-3 px-2.5 py-0.5 text-xs font-medium rounded-full ${conditionColors[product.condition] || conditionColors.new}`}>
            {product.condition?.charAt(0).toUpperCase() + product.condition?.slice(1)}
          </span>

          {product.featured && (
            <span className="absolute top-3 right-3 px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary text-white">
              Featured
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-sm font-semibold text-text line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.title}
          </h3>

          {product.car_make && (
            <p className="text-xs text-text-muted mb-2">
              {product.car_make} {product.car_model} {product.car_year && `• ${product.car_year}`}
            </p>
          )}

          <div className="flex items-center gap-1 mb-2">
            <StarRating rating={product.average_rating || 0} size="sm" />
            <span className="text-xs text-text-muted">({product.review_count || 0})</span>
          </div>

          <div className="flex items-end justify-between">
            <span className="text-lg font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            {product.seller_name && (
              <span className="text-xs text-text-muted">by {product.seller_name}</span>
            )}
          </div>

          <div className="mt-2">
            {product.stock > 0 ? (
              <span className="text-xs text-success font-medium">In Stock ({product.stock})</span>
            ) : (
              <span className="text-xs text-error font-medium">{t("outOfStock") || "Out of Stock"}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
