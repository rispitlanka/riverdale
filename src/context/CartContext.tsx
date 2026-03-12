'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, IMetal } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (metal: IMetal, quantity?: number) => void;
  removeFromCart: (metalId: string) => void;
  updateQuantity: (metalId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
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

  const addToCart = (metal: IMetal, quantity: number = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item._id === metal._id);
      
      if (existingItem) {
        return prevCart.map((item) =>
          item._id === metal._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { ...metal, quantity }];
    });
  };

  const removeFromCart = (metalId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item._id !== metalId));
  };

  const updateQuantity = (metalId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(metalId);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item._id === metalId ? { ...item, quantity } : item
      )
    );
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


