"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { admin, auth } from "@/lib/api";
import { User, Order } from "@/types";

export default function AdminPanelPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("orders");
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAdmin() {
      try {
        const currentUser = await auth.me();
        if (!currentUser.is_staff) throw new Error("Not authorized");

        const [us, ords] = await Promise.all([
          admin.users(),
          admin.orders(),
        ]);
        setUsers(us);
        setOrders(ords);
      } catch (err) {
        router.push("/");
      } finally {
        setLoading(false);
      }
    }
    initAdmin();
  }, [router]);

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    try {
      const updated = await admin.updateOrder(id, { status } as any);
      setOrders(orders.map((o) => (o.id === id ? updated : o)));
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading admin panel...</div>;

  return (
    <div className="bg-background min-h-screen">
      <div className="bg-surface border-b border-border mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text">Admin Panel</h1>
              <p className="text-text-muted text-sm">System administration and oversight</p>
            </div>
          </div>
          <div className="flex gap-6 -mb-px">
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-4 px-2 font-medium border-b-2 text-sm transition-colors ${activeTab === "orders" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text hover:border-border"}`}
            >
              All Orders
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 px-2 font-medium border-b-2 text-sm transition-colors ${activeTab === "users" ? "border-primary text-primary" : "border-transparent text-text-muted hover:text-text hover:border-border"}`}
            >
              Manage Users
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-alt text-text-muted uppercase text-xs font-semibold tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 font-semibold">#{o.id.toString().padStart(6, "0")}</td>
                    <td className="px-6 py-4 text-text-muted">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium">${Number(o.total).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase ${
                        o.status === "delivered" ? "bg-green-100 text-green-800" :
                        o.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <select
                        value={o.status}
                        onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                        className="bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-background-alt text-text-muted uppercase text-xs font-semibold tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4 text-center">Role</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 font-medium text-text-muted">{u.id}</td>
                    <td className="px-6 py-4 font-semibold text-text">{u.username}</td>
                    <td className="px-6 py-4 text-text-muted">{u.email}</td>
                    <td className="px-6 py-4 text-center">
                      {u.is_staff && <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md ml-1 font-medium border border-gray-200">Admin</span>}
                      {u.is_seller && <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md ml-1 border border-green-100">Seller</span>}
                      {!u.is_staff && !u.is_seller && <span className="px-2 py-1 bg-blue-50 text-primary text-xs rounded-md ml-1 border border-blue-100">Buyer</span>}
                    </td>
                    <td className="px-6 py-4 text-text-muted">{new Date(u.date_joined).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
