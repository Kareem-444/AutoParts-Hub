"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, orders as ordersApi, apiClient } from "@/lib/api";
import { User, Order } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPassword, setNewPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<{type: "error" | "success" | "", msg: string}>({type: "", msg: ""});
  const [isSettingPassword, setIsSettingPassword] = useState(false);

  useEffect(() => {
    async function initProfile() {
      try {
        const [u, o] = await Promise.all([auth.me(), ordersApi.list()]);
        setUser(u);
        setOrders(o);
      } catch (err) {
        router.push("/auth/login?redirect=/profile");
      } finally {
        setLoading(false);
      }
    }
    initProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingPassword(true);
    setPasswordStatus({ type: "", msg: "" });

    try {
      await apiClient<{detail: string}>("/auth/set_password/", {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });
      
      setPasswordStatus({ type: "success", msg: "Password set successfully! You can now use it to log in." });
      setUser({ ...user, has_usable_password: true });
      setNewPassword("");
    } catch (err: any) {
      setPasswordStatus({ type: "error", msg: err.message });
    } finally {
      setIsSettingPassword(false);
    }
  };

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-1/4 shrink-0">
            <div className="bg-surface border border-border rounded-xl p-6 shadow-sm sticky top-24">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <h2 className="text-xl font-bold text-text">{user.username}</h2>
                <p className="text-sm text-text-muted mt-1">{user.email}</p>
                <div className="mt-4 flex flex-col gap-2 w-full">
                  <span className="px-3 py-1 bg-blue-50 text-primary-dark text-xs font-semibold rounded-full border border-blue-100">
                    Member since {new Date(user.date_joined).getFullYear()}
                  </span>
                  {user.is_seller && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-100">
                      Marketplace Seller
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="w-full md:w-3/4">
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-border bg-background-alt flex justify-between items-center">
                <h2 className="text-lg font-bold text-text">Order History</h2>
                <span className="text-sm text-text-muted font-medium">{orders.length} orders</span>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-12 text-center text-text-muted">
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                        <div>
                          <p className="text-sm text-text-muted">Order <span className="font-semibold text-text">#{order.id.toString().padStart(6, "0")}</span></p>
                          <p className="text-xs text-text-light">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg text-primary">${Number(order.total).toFixed(2)}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            order.status === "delivered" ? "bg-green-100 text-green-800" :
                            order.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-amber-100 text-amber-800"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border border-border">
                        <ul className="space-y-3">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-text">{item.quantity}x</span>
                                <span className="text-text-muted">{item.product_title}</span>
                              </div>
                              <span className="font-medium text-text">${Number(item.subtotal).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="mt-4 flex gap-4 text-sm text-text-muted">
                        <div>
                          <strong className="text-text block">Shipping:</strong>
                          <span className="whitespace-pre-line">{order.shipping_address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden p-6">
              <h2 className="text-lg font-bold text-text mb-4">Account Settings</h2>
              <form className="max-w-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Phone Number</label>
                  <input type="text" defaultValue={user.phone} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" disabled />
                  <p className="text-xs text-text-light mt-1">Contact support to update your phone number.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Default Address</label>
                  <textarea rows={3} defaultValue={user.address} className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm" disabled />
                </div>
              </form>

              {user.has_usable_password === false && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h3 className="text-md font-bold text-text mb-4">Set Local Password</h3>
                  <p className="text-sm text-text-muted mb-4">You signed in with a social account. Set a password if you want to be able to sign in with your email directly.</p>
                  
                  {passwordStatus.msg && (
                    <div className={`p-3 rounded-lg text-sm mb-4 border flex items-start gap-2 ${
                      passwordStatus.type === "success" 
                        ? "bg-green-50 text-green-700 border-green-100" 
                        : "bg-red-50 text-error border-red-100"
                    }`}>
                      <span>{passwordStatus.msg}</span>
                    </div>
                  )}

                  <form className="max-w-lg space-y-4" onSubmit={handleSetPassword}>
                    <div>
                      <label className="block text-sm font-medium text-text mb-1">New Password</label>
                      <input 
                        type="password" 
                        required 
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-primary focus:border-primary focus:outline-none" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSettingPassword}
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark disabled:opacity-50"
                    >
                      {isSettingPassword ? "Saving..." : "Set Password"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
