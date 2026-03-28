"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { cart as cartApi } from "@/lib/api";
import { Cart } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, loading: authLoading } = useAuth();

  const refreshCart = useCallback(async () => {
    try {
      setLoading(true);
      const data = await cartApi.get();
      setCart(data);
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      refreshCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, refreshCart]);

  const addItem = async (productId: number, quantity = 1) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.addItem(productId, quantity);
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.updateItem(itemId, quantity);
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.removeItem(itemId);
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    setLoading(true);
    try {
      const updatedCart = await cartApi.clear();
      setCart(updatedCart);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateItem, removeItem, clearCart, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
