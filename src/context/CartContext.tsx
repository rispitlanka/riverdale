'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, IMetal } from '@/types';
import { getMaxCartQuantityForItem } from '@/lib/cartStock';

interface CartContextType {
  cart: CartItem[];
  /** Returns true only if the full requested quantity was added (not capped by stock). */
  addToCart: (metal: IMetal, quantity?: number) => boolean;
  removeFromCart: (metalId: string) => void;
  updateQuantity: (metalId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartTax: () => number;
  getCartCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('shopping-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (metal: IMetal, quantity: number = 1): boolean => {
    const maxForLine = getMaxCartQuantityForItem(metal);
    const outcome = { allRequestedAdded: true };

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === metal._id);
      const currentQty = existingItem?.quantity ?? 0;
      const desiredTotal = currentQty + quantity;
      const nextQty = Math.min(desiredTotal, maxForLine);

      outcome.allRequestedAdded = nextQty >= desiredTotal;

      if (existingItem) {
        return prevCart.map((item) =>
          item._id === metal._id ? { ...item, quantity: nextQty } : item
        );
      }

      if (nextQty < 1) {
        outcome.allRequestedAdded = false;
        return prevCart;
      }

      return [...prevCart, { ...metal, quantity: nextQty }];
    });

    return outcome.allRequestedAdded;
  };

  const removeFromCart = (metalId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== metalId));
  };

  const updateQuantity = (metalId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(metalId);
      return;
    }

    setCart((prevCart) => {
      const item = prevCart.find((i) => i._id === metalId);
      if (!item) return prevCart;

      const maxForLine = getMaxCartQuantityForItem(item);
      const nextQty = Math.min(Math.max(1, Math.floor(quantity)), maxForLine);

      if (nextQty < 1) {
        return prevCart.filter((i) => i._id !== metalId);
      }

      return prevCart.map((i) =>
        i._id === metalId ? { ...i, quantity: nextQty } : i
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('shopping-cart');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      return total + (item.pricePerGram * item.weight * item.quantity);
    }, 0);
  };

  const getCartTax = () => {
    return cart.reduce((total, item) => {
      if (item.taxIncluded && item.taxPercent && item.taxPercent > 0) {
        const itemTotal = item.pricePerGram * item.weight * item.quantity;
        return total + itemTotal * (item.taxPercent / 100);
      }
      return total;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartTax,
        getCartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}


