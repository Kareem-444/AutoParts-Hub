"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { orders as ordersApi } from "@/lib/api";
import { useCart } from "@/context/CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, loading, updateItem, removeItem, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  // Form State
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!loading && typeof window !== "undefined") {
      if (!localStorage.getItem("token")) {
        router.push("/auth/login?redirect=/checkout");
      }
    }
  }, [loading, router]);

  const handleUpdateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) {
      await handleRemove(itemId);
      return;
    }
    try {
      await updateItem(itemId, newQty);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setError("Please enter a shipping address.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const order = await ordersApi.create({ shipping_address: address, phone, notes });
      setSuccessOrderId(order.id);
      await clearCart();
      
      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/profile");
      }, 3000);
      
    } catch (err: any) {
      setError(err.message || "Failed to place order");
      setSubmitting(false);
    }
  };

  if (successOrderId) {
    return (
      <div className="flex flex-col h-[60vh] items-center justify-center text-center px-4">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-text mb-4">Order Confirmed!</h2>
        <p className="text-lg text-text-muted mb-6">
          Your order ID is <span className="font-bold text-text">#{successOrderId}</span>
        </p>
        <p className="text-sm text-text-light animate-pulse">
          Redirecting to your profile in 3 seconds...
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-text mb-4">Your cart is empty</h2>
        <p className="text-text-muted mb-8">Looks like you haven't added any parts to your cart yet.</p>
        <Link href="/search" className="inline-block px-8 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-text mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Order Summary */}
          <div className="w-full lg:w-3/5">
            <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border bg-background-alt">
                <h2 className="text-lg font-bold text-text">Order Items</h2>
              </div>
              <ul className="divide-y divide-border">
                {cart.items.map((item: any) => (
                  <li key={item.id} className="p-6 flex items-start gap-4">
                    <div className="w-20 h-20 shrink-0 bg-background-alt rounded-lg border border-border overflow-hidden">
                      {item.product.primary_image ? (
                        <img src={item.product.primary_image} alt={item.product.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-text-light">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product.id}`} className="text-sm font-semibold text-text hover:text-primary line-clamp-2">
                        {item.product.title}
                      </Link>
                      <p className="mt-1 text-sm text-text-muted">Unit Price: ${Number(item.product.price).toFixed(2)}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center border border-border rounded-md bg-white">
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="px-3 py-1 text-text-muted hover:text-text">-</button>
                          <span className="text-sm font-medium px-2">{item.quantity}</span>
                          <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="px-3 py-1 text-text-muted hover:text-text">+</button>
                        </div>
                        <button onClick={() => handleRemove(item.id)} className="text-sm text-error font-medium hover:underline">
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-text">${Number(item.subtotal).toFixed(2)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Shipping & Payment */}
          <div className="w-full lg:w-2/5">
            <form onSubmit={handlePlaceOrder} className="bg-surface border border-border rounded-xl p-6 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-text mb-6">Shipping Details</h2>

              {error && (
                <div className="mb-4 bg-red-50 text-error p-3 rounded-lg text-sm border border-red-100">
                  {error}
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Full Shipping Address</label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="123 Main St, Apt 4B&#10;City, State 12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Phone Number</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Order Notes (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Delivery instructions..."
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6 mb-6">
                <h3 className="text-sm font-bold text-text mb-4">Payment Method</h3>
                <div className="bg-background-alt border border-border border-dashed rounded-lg p-4 text-center">
                  <p className="text-sm text-text-muted font-medium">Payment Gateway Placeholder</p>
                  <p className="text-xs text-text-light mt-1">Integration with Stripe/PayPal goes here.</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-sm mb-2 text-text-muted">
                  <span>Subtotal</span>
                  <span>${Number(cart.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mb-2 text-text-muted">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-text mt-4">
                  <span>Total</span>
                  <span className="text-primary">${Number(cart.total).toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-sm transition-colors ${
                  submitting ? "bg-primary-light cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
                }`}
              >
                {submitting ? "Processing..." : "Place Order"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
