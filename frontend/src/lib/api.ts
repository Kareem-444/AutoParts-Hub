/**
 * API client for communicating with the Django backend.
 */

import { User, Category, Product, Review, Cart, Order, SellerProfile } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || error.error || JSON.stringify(error));
  }

  if (res.status === 204) return null as T;
  const data = await res.json();
  // Automatically extract paginated results if present
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results as T;
  }
  return data as T;
}

// Auth
export const auth = {
  login: (data: Record<string, string>) => request<{ token: string; user: User }>("/auth/login/", { method: "POST", body: JSON.stringify(data) }),
  register: (data: Record<string, string>) => request<{ token: string; user: User }>("/auth/register/", { method: "POST", body: JSON.stringify(data) }),
  me: () => request<User>("/auth/me/"),
};

// Categories
export const categories = {
  list: () => request<Category[]>("/categories/"),
  get: (slug: string) => request<Category>(`/categories/${slug}/`),
};

// Products
export const products = {
  list: (params = "") => request<Product[]>(`/products/${params ? "?" + params : ""}`),
  get: (id: number | string) => request<Product>(`/products/${id}/`),
  featured: () => request<Product[]>("/products/featured/"),
  latest: () => request<Product[]>("/products/latest/"),
  create: (data: Partial<Product>) => request<Product>("/products/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Product>) => request<Product>(`/products/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => request<void>(`/products/${id}/`, { method: "DELETE" }),
};

// Reviews
export const reviews = {
  list: (productId: number | string) => request<Review[]>(`/products/${productId}/reviews/`),
  create: (productId: number | string, data: { rating: number; comment?: string }) =>
    request<Review>(`/products/${productId}/reviews/`, { method: "POST", body: JSON.stringify(data) }),
};

// Cart
export const cart = {
  get: () => request<Cart>("/cart/"),
  addItem: (productId: number, quantity = 1) =>
    request<Cart>("/cart/add_item/", { method: "POST", body: JSON.stringify({ product_id: productId, quantity }) }),
  updateItem: (itemId: number, quantity: number) =>
    request<Cart>("/cart/update_item/", { method: "POST", body: JSON.stringify({ item_id: itemId, quantity }) }),
  removeItem: (itemId: number) =>
    request<Cart>("/cart/remove_item/", { method: "POST", body: JSON.stringify({ item_id: itemId }) }),
  clear: () => request<Cart>("/cart/clear/", { method: "POST" }),
};

// Orders
export const orders = {
  list: () => request<Order[]>("/orders/"),
  get: (id: number | string) => request<Order>(`/orders/${id}/`),
  create: (data: Partial<Order>) => request<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }),
};

// Seller
export const seller = {
  dashboard: () => request<{ profile: SellerProfile; product_count: number; total_orders: number; recent_products: Product[] }>("/seller/"),
  products: () => request<Product[]>("/seller/products/"),
  orders: () => request<Order[]>("/seller/orders/"),
};

// Admin
export const admin = {
  users: () => request<User[]>("/admin/users/"),
  orders: () => request<Order[]>("/admin/orders/"),
  updateOrder: (id: number, data: Partial<Order>) => request<Order>(`/admin/orders/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
};
