"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { seller as sellerApi, products as productsApi } from "@/lib/api";
import { SellerProfile, Product, Order } from "@/types";
import { useAuth } from "@/context/AuthContext";

export default function SellerDashboardPage() {
  const t = useTranslations();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/seller");
      return;
    }

    async function initDashboard() {
      try {
        const [dash, p, o] = await Promise.all([
          sellerApi.dashboard(),
          sellerApi.products(),
          sellerApi.orders(),
        ]);
        setProfile(dash.profile);
        
        // Calculate total revenue from orders
        const revenue = o.reduce((sum, order) => sum + Number(order.total), 0);
        setStats({ products: dash.product_count, orders: dash.total_orders, revenue });
        
        setProducts(p);
        setOrders(o);
      } catch (err: any) {
        if (err.message?.includes("Unauthorized") || err.message?.includes("credentials") || err.message?.includes("permission")) {
          router.push("/"); // Not a seller
        }
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [router, isAuthenticated, authLoading]);

  const confirmDelete = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(deletingId);
      // Optimistic update
      setProducts(products.filter(p => p.id !== deletingId));
      setStats(prev => ({ ...prev, products: prev.products - 1 }));
      setShowDeleteModal(false);
    } catch (err: any) {
      alert(t("Seller.errorDelete") + ": " + (err.message || ""));
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text tracking-tight">{t("Seller.dashboard")}</h1>
            <p className="text-text-muted mt-1 font-medium">{profile?.store_name}</p>
          </div>
          <Link
            href="/seller/new"
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            {t("Seller.addProduct")}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">{t("Seller.activeListings")}</p>
              <h3 className="text-3xl font-extrabold text-text">{stats.products}</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">{t("Seller.totalOrders")}</p>
              <h3 className="text-3xl font-extrabold text-text">{stats.orders}</h3>
            </div>
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">{t("Seller.totalRevenue")}</p>
              <h3 className="text-3xl font-extrabold text-text">${stats.revenue.toFixed(2)}</h3>
            </div>
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="-mb-px flex space-x-8 ltr:space-x-8 rtl:space-x-reverse" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("products")}
              className={`${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text hover:border-border"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
            >
              {t("Seller.myProducts")}
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`${
                activeTab === "orders"
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text hover:border-border"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg`}
            >
              {t("Seller.myOrders")}
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === "products" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.length === 0 ? (
              <div className="col-span-full bg-surface border border-border rounded-xl p-12 text-center">
                <p className="text-text-muted">{t("Seller.noProducts")}</p>
              </div>
            ) : (
              products.map((p) => (
                <div key={p.id} className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="aspect-[4/3] bg-background-alt relative">
                    {p.primary_image ? (
                      <img src={p.primary_image} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-light">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="bg-background/90 text-text text-xs font-bold px-2 py-1 rounded backdrop-blur-sm shadow-sm capitalize">
                        {t(`Seller.${p.condition}`)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-text truncate mb-1" title={p.title}>{p.title}</h3>
                    <p className="text-sm text-text-muted mb-3 line-clamp-1">{p.car_make} {p.car_model}</p>
                    
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-extrabold text-primary">${Number(p.price).toFixed(2)}</span>
                      <span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${p.stock < 5 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {t("Seller.stock")}: {p.stock}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link
                        href={`/seller/edit/${p.id}`}
                        className="py-2 text-center text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {t("Seller.editProduct")}
                      </Link>
                      <button
                        onClick={() => confirmDelete(p.id)}
                        className="py-2 text-center text-sm font-medium text-white border border-red-500 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        {t("Seller.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right">
                <thead className="bg-background-alt text-text-muted uppercase text-xs font-semibold tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4">{t("Seller.buyer")}</th>
                    <th className="px-6 py-4">{t("Seller.total")}</th>
                    <th className="px-6 py-4">{t("Seller.status")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-text-muted">
                        {t("Seller.noOrders")}
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-text">#{o.id}</div>
                          <div className="text-text-muted text-xs truncate max-w-[200px]">{o.shipping_address}</div>
                        </td>
                        <td className="px-6 py-4 font-bold">${Number(o.total).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                            ${o.status === 'pending' ? 'bg-yellow-50 text-yellow-700' : 
                              o.status === 'shipped' ? 'bg-blue-50 text-blue-700' : 
                              o.status === 'delivered' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-700'}`}
                          >
                            {t(`Seller.${o.status}`)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-text mb-2">{t("Seller.deleteProduct")}</h3>
            <p className="text-text-muted mb-6">{t("Seller.confirmDelete")}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-text font-medium hover:bg-background rounded-lg transition-colors border border-border"
                disabled={isDeleting}
              >
                {t("Seller.cancel")}
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> : null}
                {t("Seller.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
