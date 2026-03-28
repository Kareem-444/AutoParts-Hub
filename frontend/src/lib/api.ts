/**
 * API client for communicating with the Django backend.
 * Uses JWT access tokens (in-memory) and HttpOnly refresh cookies.
 * Automatically handles CSRF tokens for mutating requests.
 */

import { User, Category, Product, Review, Cart, Order, SellerProfile } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// ---------------------------------------------------------------------------
// Access token bridge (set by AuthContext)
// ---------------------------------------------------------------------------
let _getAccessToken: (() => string | null) | null = null;

export function setAccessTokenGetter(getter: () => string | null) {
  _getAccessToken = getter;
}

// ---------------------------------------------------------------------------
// CSRF token cache
// ---------------------------------------------------------------------------
let _csrfToken: string | null = null;

async function getCSRFToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  try {
    const res = await fetch(`${API_BASE}/auth/csrf/`, { credentials: "include" });
    const data = await res.json();
    _csrfToken = data.csrfToken;
    return _csrfToken!;
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------------
// Silent refresh
// ---------------------------------------------------------------------------
async function attemptRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Core API client
// ---------------------------------------------------------------------------
interface RequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Attach access token if available
  const token = _getAccessToken ? _getAccessToken() : null;
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Attach CSRF token for mutating requests
  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrf = await getCSRFToken();
    if (csrf) {
      headers["X-CSRFToken"] = csrf;
    }
  }

  let res = await fetch(url, { ...options, headers, credentials: "include" });

  // If 401, attempt silent refresh and retry once
  if (res.status === 401) {
    const newToken = await attemptRefresh();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      res = await fetch(url, { ...options, headers, credentials: "include" });
    } else {
      // Refresh also failed — redirect to login
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
      throw new Error("Unauthorized");
    }
  }

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
  me: () => apiClient<User>("/auth/me/"),
};

// Categories
export const categories = {
  list: () => apiClient<Category[]>("/categories/"),
  get: (slug: string) => apiClient<Category>(`/categories/${slug}/`),
};

// Products
export const products = {
  list: (params = "") => apiClient<Product[]>(`/products/${params ? "?" + params : ""}`),
  get: (id: number | string) => apiClient<Product>(`/products/${id}/`),
  featured: () => apiClient<Product[]>("/products/featured/"),
  latest: () => apiClient<Product[]>("/products/latest/"),
  create: (data: Partial<Product>) => apiClient<Product>("/products/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Product>) => apiClient<Product>(`/products/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) => apiClient<void>(`/products/${id}/`, { method: "DELETE" }),
};

// Reviews
export const reviews = {
  list: (productId: number | string) => apiClient<Review[]>(`/products/${productId}/reviews/`),
  create: (productId: number | string, data: { rating: number; comment?: string }) =>
    apiClient<Review>(`/products/${productId}/reviews/`, { method: "POST", body: JSON.stringify(data) }),
};

// Cart
export const cart = {
  get: () => apiClient<Cart>("/cart/"),
  addItem: (productId: number, quantity = 1) =>
    apiClient<Cart>("/cart/add_item/", { method: "POST", body: JSON.stringify({ product_id: productId, quantity }) }),
  updateItem: (itemId: number, quantity: number) =>
    apiClient<Cart>("/cart/update_item/", { method: "POST", body: JSON.stringify({ item_id: itemId, quantity }) }),
  removeItem: (itemId: number) =>
    apiClient<Cart>("/cart/remove_item/", { method: "POST", body: JSON.stringify({ item_id: itemId }) }),
  clear: () => apiClient<Cart>("/cart/clear/", { method: "POST" }),
};

// Orders
export const orders = {
  list: () => apiClient<Order[]>("/orders/"),
  get: (id: number | string) => apiClient<Order>(`/orders/${id}/`),
  create: (data: Partial<Order>) => apiClient<Order>("/orders/", { method: "POST", body: JSON.stringify(data) }),
};

// Seller
export const seller = {
  dashboard: () => apiClient<{ profile: SellerProfile; product_count: number; total_orders: number; recent_products: Product[] }>("/seller/"),
  products: () => apiClient<Product[]>("/seller/products/"),
  orders: () => apiClient<Order[]>("/seller/orders/"),
};

// Admin
export const admin = {
  users: () => apiClient<User[]>("/admin/users/"),
  orders: () => apiClient<Order[]>("/admin/orders/"),
  updateOrder: (id: number, data: Partial<Order>) => apiClient<Order>(`/admin/orders/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
};
