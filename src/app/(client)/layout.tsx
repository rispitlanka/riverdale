'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartProvider, useCart } from '@/context/CartContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

function Navigation() {
  const { getCartCount } = useCart();
  const cartCount = getCartCount();
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`border-b border-border backdrop-blur-sm sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-background/95 shadow-md' 
        : 'bg-background'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20 relative">
          {/* Logo - Left */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <div className="relative w-32 h-32">
                <Image
                  src={theme === 'dark' ? '/Logo_W.svg' : '/Logo_W.svg'}
                  alt="Riverdale Pawn Brokers"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
          </div>
            
          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            <Link href="/products" className="text-foreground hover:text-[#FBC02E] transition-colors font-medium">
              Products
            </Link>
            <Link href="/sell" className="text-foreground hover:text-[#FBC02E] transition-colors font-medium">
              Sell Metals
            </Link>
            <Link href="/track/search" className="text-foreground hover:text-[#FBC02E] transition-colors font-medium">
              Orders
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-foreground hover:text-[#FBC02E] transition-colors rounded-lg hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 text-foreground hover:text-[#FBC02E] transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-[#FBC02E] text-foreground text-xs font-bold">
                  {cartCount}
                </Badge>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Navigation />
      <main className="min-h-[calc(100vh-12rem)]">{children}</main>
      <footer className="bg-card border-t border-border py-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Logo and Tagline */}
            <div className="lg:col-span-2">
              <Link href="/" className="flex items-center gap-4 mb-4">
                <div className="relative w-32 h-32">
                  <Image
                    src={theme === 'dark' ? '/Logo_D.svg' : '/Logo_W.svg'}
                    alt="Riverdale Pawn Brokers"
                    fill
                    className="object-contain"
                  />
                </div>
              </Link>
              <p className="text-muted-foreground text-sm max-w-md">
                Your trusted partner for buying and selling precious metals since 1995.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/products" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    Products
                  </Link>
                </li>
                <li>
                  <Link href="/sell" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    Sell Metals
                  </Link>
                </li>
                <li>
                  <Link href="/track/search" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    Orders
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-muted-foreground hover:text-[#FBC02E] transition-colors">
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2026 Riverdale Pawn Brokers. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Email: <a href="mailto:riverdalepawnbrokers@gmail.com" className="text-[#FBC02E] hover:text-[#E5AD1F]">riverdalepawnbrokers@gmail.com</a> | Phone: <a href="tel:+14379841061" className="text-[#FBC02E] hover:text-[#E5AD1F]">+1 437 984 1061</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <LayoutContent>{children}</LayoutContent>
      </CartProvider>
    </ThemeProvider>
  );
}

