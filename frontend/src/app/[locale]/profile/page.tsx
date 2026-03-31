"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, orders as ordersApi, apiClient } from "@/lib/api";
import { User, Order } from "@/types";
import { useModal } from "@/context/ModalContext";
import ProfileLoading from "./loading";

export default function ProfilePage() {
  const router = useRouter();
  const { showModal } = useModal();
  
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newPassword, setNewPassword] = useState("");
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  
  // Profile edit states
  const [address, setAddress] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function initProfile() {
      try {
        const [u, o] = await Promise.all([auth.me(), ordersApi.list()]);
        setUser(u);
        setOrders(o);
        setAddress(u.address || "");
        if (u.avatar_url) {
          setAvatarPreview(u.avatar_url);
        }
      } catch (err) {
        router.push("/auth/login?redirect=/profile");
      } finally {
        setLoading(false);
      }
    }
    initProfile();
  }, [router]);

  if (loading) {
    return <ProfileLoading />;
  }

  if (!user) return null;

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingPassword(true);

    try {
      await apiClient<{detail: string}>("/auth/set_password/", {
        method: "POST",
        body: JSON.stringify({ password: newPassword }),
      });
      showModal({
        type: "success",
        title: "Password Set",
        message: "Password set successfully! You can now use it to log in.",
      });
      setUser({ ...user, has_usable_password: true });
      setNewPassword("");
    } catch (err: any) {
      showModal({
        type: "error",
        title: "Error Setting Password",
        message: err.message || "Failed to set password",
      });
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const formData = new FormData();
      formData.append("address", address);
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      const updatedUser = await auth.updateProfile(formData);
      setUser(updatedUser);
      setAvatarFile(null); // Clear pending file state
      showModal({
        type: "success",
        title: "Profile Updated",
        message: "Your profile changes were successfully saved.",
      });
    } catch (err: any) {
      showModal({
        type: "error",
        title: "Error Updating Profile",
        message: err.message || "An unexpected error occurred while saving.",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Convert username to initials for avatar fallback
  const initials = user.username.slice(0, 2).toUpperCase();

  return (
    <div className="bg-background min-h-screen pb-12 bg-zinc-50 dark:bg-zinc-950">
      {/* Cover Profile Header */}
      <div className="w-full h-48 md:h-64 bg-gradient-to-r from-blue-600 to-indigo-800 relative shadow-sm">
        {/* Abstract pattern via CSS/SVG if desired */}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Sidebar (Avatar + Info) */}
          <div className="w-full md:w-1/3 shrink-0 -mt-24 relative z-10">
            <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden p-6 text-center">
              
              <div className="relative inline-block mb-4">
                <div className="w-32 h-32 md:w-40 md:h-40 bg-primary text-white rounded-full flex items-center justify-center text-5xl font-bold border-4 border-surface shadow-md overflow-hidden mx-auto bg-white/10 shrink-0">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                  {/* Upload Overlay */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  >
                    <svg className="w-8 h-8 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange} 
                />
              </div>

              <h2 className="text-2xl font-bold text-text">{user.username}</h2>
              <p className="text-sm text-text-muted mt-1">{user.email}</p>
              
              <div className="mt-6 flex flex-col gap-3 w-full border-t border-border pt-6">
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-text-muted">Member Since</span>
                  <span className="font-semibold text-text">{new Date(user.date_joined).getFullYear()}</span>
                </div>
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-text-muted">Role</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${user.is_seller ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    {user.is_seller ? "Seller" : "Buyer"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm px-2">
                  <span className="text-text-muted">Total Orders</span>
                  <span className="font-semibold text-text">{orders.length}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Right Main Content */}
          <div className="w-full md:w-2/3 space-y-8 pt-8 md:pt-4">
            
            {/* Form Edit Card */}
            <div className="bg-surface border border-border rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-text mb-6 pb-2 border-b border-border">Profile Details</h2>
              <form className="space-y-5" onSubmit={handleSaveProfile}>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-text mb-1">Username</label>
                    <input type="text" value={user.username} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background-alt text-text-muted cursor-not-allowed text-sm" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-text mb-1">Email</label>
                    <input type="email" value={user.email} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background-alt text-text-muted cursor-not-allowed text-sm" disabled />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Phone Number</label>
                  <input type="text" value={user.phone || ""} className="w-full px-4 py-2.5 border border-border rounded-lg bg-background-alt text-text-muted cursor-not-allowed text-sm" disabled />
                  <p className="text-xs text-text-light mt-1.5">Phone number editing is restricted. Contact support for changes.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-text mb-1">Delivery Address</label>
                  <textarea 
                    rows={3} 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your street, city, country..."
                    className="w-full px-4 py-3 border border-border rounded-lg bg-background text-text text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" 
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    type="submit" 
                    disabled={isUpdatingProfile}
                    className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
                  >
                    {isUpdatingProfile ? (
                       <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span>
                    ) : null}
                    Save Profile
                  </button>
                </div>
              </form>
            </div>

            {/* Set Password Card (Conditional) */}
            {user.has_usable_password === false && (
              <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden text-amber-900 bg-amber-50/30">
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">Set Local Password</h3>
                  <p className="text-sm opacity-80 mb-5">You signed in with a social account. Set a password if you want to be able to sign in with your email directly.</p>
                  
                  <form className="max-w-md space-y-4" onSubmit={handleSetPassword}>
                    <div>
                      <input 
                        type="password" 
                        required 
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter 8+ characters"
                        className="w-full px-4 py-2.5 border border-amber-200 rounded-lg bg-white focus:ring-amber-500 focus:border-amber-500 focus:outline-none" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSettingPassword}
                      className="px-5 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-70 transition-colors shadow-sm"
                    >
                      {isSettingPassword ? "Saving..." : "Set Password"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Orders History Card */}
            <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-background-alt flex justify-between items-center">
                <h2 className="text-lg font-bold text-text">Recent Orders</h2>
                <span className="text-sm text-text-muted font-medium">{orders.length} total</span>
              </div>
              
              {orders.length === 0 ? (
                <div className="p-12 text-center text-text-muted bg-surface/50">
                  <svg className="w-12 h-12 mx-auto text-border-dark mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>You haven't placed any orders yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <div key={order.id} className="p-6 transition-colors hover:bg-background-alt/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                        <div>
                          <p className="text-sm text-text-muted">Order <span className="font-bold text-text">#{order.id.toString().padStart(6, "0")}</span></p>
                          <p className="text-xs text-text-light">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-lg text-primary">${Number(order.total).toFixed(2)}</span>
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${
                            order.status === "delivered" ? "bg-green-100 text-green-800 border border-green-200" :
                            order.status === "cancelled" ? "bg-red-100 text-red-800 border border-red-200" :
                            "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="bg-background rounded-lg p-4 border border-border/60">
                        <ul className="space-y-3">
                          {order.items.map((item) => (
                            <li key={item.id} className="flex justify-between items-center text-sm">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-text bg-background-alt px-2 py-0.5 rounded text-xs">{item.quantity}x</span>
                                <span className="text-text-muted font-medium">{item.product_title}</span>
                              </div>
                              <span className="font-semibold text-text">${Number(item.subtotal).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
