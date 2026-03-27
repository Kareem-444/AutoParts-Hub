"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { seller as sellerApi, products as productsApi } from "@/lib/api";
import { SellerProfile, Product, Order } from "@/types";

export default function SellerDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ products: 0, orders: 0 });
  const [loading, setLoading] = useState(true);

  // New product form
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", price: "", stock: 1, condition: "new",
    car_make: "", car_model: "", car_year: "", category: 1,
  });

  useEffect(() => {
    async function initDashboard() {
      try {
        const [dash, p, o] = await Promise.all([
          sellerApi.dashboard(),
          sellerApi.products(),
          sellerApi.orders(),
        ]);
        setProfile(dash.profile);
        setStats({ products: dash.product_count, orders: dash.total_orders });
        setProducts(p);
        setOrders(o);
      } catch (err: any) {
        if (err.message?.includes("credentials") || err.message?.includes("authentication") || err.message?.includes("permission")) {
          router.push("/"); // Not a seller
        }
      } finally {
        setLoading(false);
      }
    }
    initDashboard();
  }, [router]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newProd = await productsApi.create(formData as any);
      setProducts([newProd, ...products]);
      setStats((prev) => ({ ...prev, products: prev.products + 1 }));
      setShowAddModal(false);
      alert("Product created successfully!");
    } catch (err: any) {
      alert("Error: " + (err.message || "Failed to create product"));
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text tracking-tight">Seller Dashboard</h1>
            <p className="text-text-muted mt-1 font-medium">{profile?.store_name}</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Add New Product
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Active Listings</p>
              <h3 className="text-4xl font-extrabold text-text">{stats.products}</h3>
            </div>
            <div className="w-14 h-14 bg-blue-50 text-primary rounded-full flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
          </div>
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-muted mb-1">Total Orders</p>
              <h3 className="text-4xl font-extrabold text-text">{stats.orders}</h3>
            </div>
            <div className="w-14 h-14 bg-green-50 text-success rounded-full flex items-center justify-center">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mb-10">
          <div className="px-6 py-4 border-b border-border bg-background-alt">
            <h2 className="text-lg font-bold text-text">Your Products</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-alt text-text-muted uppercase text-xs font-semibold tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Condition</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3 text-center">Stock</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                      You haven't listed any products yet.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.id} className="hover:bg-background transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-text">{p.title}</div>
                        <div className="text-xs text-text-light">{p.car_make} {p.car_model}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="capitalize px-2 py-1 bg-background-alt border border-border rounded-md text-xs">{p.condition}</span>
                      </td>
                      <td className="px-6 py-4 font-medium">${Number(p.price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`font-semibold ${p.stock < 5 ? "text-error" : "text-success"}`}>{p.stock}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/products/${p.id}`} className="text-primary hover:underline font-medium">View</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Product Modal (Simplified) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-text bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-text">Add New Product</h2>
              <button onClick={() => setShowAddModal(false)} className="text-text-muted hover:text-text">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-1">Title</label>
                <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-background font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Price ($)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Stock Quantity</label>
                  <input required type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1">Description</label>
                <textarea required rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Category ID (1-8 for demo)</label>
                  <input required type="number" value={formData.category} onChange={(e) => setFormData({...formData, category: parseInt(e.target.value)})} className="w-full px-3 py-2 border rounded-lg bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Condition</label>
                  <select value={formData.condition} onChange={(e) => setFormData({...formData, condition: e.target.value})} className="w-full px-3 py-2 border rounded-lg bg-background">
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 border border-border rounded-lg text-text font-medium hover:bg-background">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark shadow-sm">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
