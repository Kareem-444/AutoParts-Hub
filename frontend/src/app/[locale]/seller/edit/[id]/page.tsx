"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { products as productsApi, categories as categoriesApi } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUtils";
import { Category, Product, ProductImage } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useModal } from "@/context/ModalContext";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const productId = parseInt(unwrappedParams.id, 10);
  
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showModal } = useModal();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    stock: "1",
    condition: "new",
    car_make: "",
    car_model: "",
    car_year: "",
    category: "",
  });

  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  
  const totalImages = existingImages.length + newImages.length;

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/seller/edit/${productId}`);
      return;
    }

    async function fetchData() {
      try {
        const [cats, prod] = await Promise.all([
          categoriesApi.list(),
          productsApi.get(productId)
        ]);
        
        setCategories(cats);
        
        // Ensure price is formatted as typical number string without currency symbol
        const formattedPrice = typeof prod.price === 'string' ? prod.price.replace(/[^0-9.]/g, '') : prod.price;
        
        setFormData({
          title: prod.title || "",
          description: prod.description || "",
          price: formattedPrice?.toString() || "",
          stock: prod.stock?.toString() || "0",
          condition: prod.condition || "new",
          car_make: prod.car_make || "",
          car_model: prod.car_model || "",
          car_year: prod.car_year?.toString() || "",
          category: prod.category?.toString() || "",
        });
        
        setExistingImages(prod.images || []);
      } catch (err: any) {
        showModal({
          type: "error",
          title: "Error Loading Data",
          message: err.message || "Failed to load product data",
          onConfirm: () => router.push("/seller")
        });
      } finally {
        setInitLoading(false);
      }
    }
    fetchData();
  }, [productId, isAuthenticated, authLoading, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const addedFiles = Array.from(e.target.files);
      const allowedCount = 5 - totalImages;
      const filesToAdd = addedFiles.slice(0, allowedCount);

      if (filesToAdd.length < addedFiles.length) {
        showModal({
          type: "warning",
          title: t("Seller.maxImages"),
          message: "You have selected more images than allowed.",
        });
      }

      setNewImages(prev => [...prev, ...filesToAdd]);
      
      const previews = filesToAdd.map(file => URL.createObjectURL(file));
      setNewPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    URL.revokeObjectURL(newPreviews[index]);
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: number) => {
    showModal({
      type: "confirm",
      title: "Delete Image",
      message: t("Seller.confirmDelete"),
      onConfirm: async () => {
        try {
          await productsApi.deleteImage(productId, imageId);
          setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } catch (err: any) {
          showModal({
            type: "error",
            title: "Deletion Error",
            message: "Error deleting image: " + (err.message || ""),
          });
        }
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalImages === 0) {
      showModal({
        type: "warning",
        title: "Missing Images",
        message: t("Seller.maxImages") + " (Min 1)",
      });
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      newImages.forEach(img => {
        data.append("images", img);
      });

      await productsApi.update(productId, data);
      showModal({
        type: "success",
        title: "Success",
        message: t("Seller.successUpdate"),
        onConfirm: () => router.push("/seller")
      });
    } catch (err: any) {
      showModal({
        type: "error",
        title: "Error Updating",
        message: t("Seller.errorUpdate") + ": " + (err.message || ""),
      });
      setLoading(false);
    }
  };

  if (initLoading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/seller" className="text-primary hover:underline font-medium inline-flex items-center gap-2 mb-4">
            <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            {t("Seller.dashboard")}
          </Link>
          <h1 className="text-3xl font-extrabold text-text tracking-tight">{t("Seller.editProduct")}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Left Column - Basics */}
            <div className="space-y-5 flex flex-col">
              <div>
                <label className="block text-sm font-bold text-text mb-2">{t("Seller.title")} *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
              </div>

              <div>
                <label className="block text-sm font-bold text-text mb-2">{t("Seller.description")} *</label>
                <textarea required rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.price")} ($) *</label>
                  <input required type="number" step="0.01" min="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.stock")} *</label>
                  <input required type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" />
                </div>
              </div>
            </div>

            {/* Right Column - Attributes & Images */}
            <div className="space-y-5 flex flex-col">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.condition")} *</label>
                  <select required value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                    <option value="new">{t("Seller.new")}</option>
                    <option value="used">{t("Seller.used")}</option>
                    <option value="refurbished">{t("Seller.refurbished")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.category")} *</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all">
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.carMake")} *</label>
                  <input required type="text" placeholder="e.g. Toyota" value={formData.car_make} onChange={e => setFormData({...formData, car_make: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.carModel")} *</label>
                  <input required type="text" placeholder="e.g. Camry" value={formData.car_model} onChange={e => setFormData({...formData, car_model: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-text mb-2">{t("Seller.carYear")} *</label>
                  <input required type="number" placeholder="2020" value={formData.car_year} onChange={e => setFormData({...formData, car_year: e.target.value})} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>

              {/* Images Section */}
              <div className="flex-1 mt-2">
                <label className="block text-sm font-bold text-text mb-2">
                  {t("Seller.images")} * <span className="font-normal text-text-muted text-xs ms-2">({t("Seller.maxImages")})</span>
                </label>
                
                {totalImages < 5 && (
                  <div 
                    className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-background transition-colors h-[120px] mb-4"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (e.dataTransfer.files) {
                        const dt = new DataTransfer();
                        Array.from(e.dataTransfer.files).forEach(f => dt.items.add(f));
                        handleImageChange({ target: { files: dt.files } } as any);
                      }
                    }}
                  >
                    <svg className="w-8 h-8 text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-primary font-medium">{t("Seller.uploadImages")}</span>
                    <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </div>
                )}

                {(existingImages.length > 0 || newPreviews.length > 0) && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {/* Existing Images */}
                    {existingImages.map((img, i) => (
                      <div key={`exist-${img.id}`} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-border group">
                        <img src={getImageUrl(img.image)} alt="existing" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute inset-0 bg-red-600/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        {img.is_primary && (
                          <span className="absolute bottom-0 inset-x-0 bg-primary/90 text-white text-[10px] text-center py-0.5 font-bold">Primary</span>
                        )}
                      </div>
                    ))}
                    
                    {/* New Previews */}
                    {newPreviews.map((preview, i) => (
                      <div key={`new-${i}`} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-border border-dashed group">
                        <img src={preview} alt="preview" className="w-full h-full object-cover opacity-80" />
                        <button 
                          type="button" 
                          onClick={() => removeNewImage(i)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <span className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 font-bold rounded">New</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end gap-3">
            <Link href="/seller" className="px-6 py-2.5 border border-border rounded-lg text-text font-medium hover:bg-background transition-colors">
              {t("Seller.cancel")}
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm flex items-center gap-2"
            >
              {loading ? <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></span> : null}
              {loading ? t("Seller.saving") : t("Seller.saveProduct")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
