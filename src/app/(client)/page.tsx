'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import LiveGoldPrice from '@/components/LiveGoldPrice';
import { Shield, Award, Truck, TrendingUp, ArrowRight } from 'lucide-react';
import { IMetal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<IMetal[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/metals', {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok || (data && typeof data === 'object' && 'error' in data)) {
        console.error('API Error:', data);
        setFeaturedProducts([]);
        setLoading(false);
        return;
      }
      
      if (!Array.isArray(data)) {
        console.error('Invalid data format (not an array):', data);
        setFeaturedProducts([]);
        setLoading(false);
        return;
      }
      
      const featured = data
        .filter((metal: any) => {
          return metal && 
                 metal._id && 
                 metal.name && 
                 metal.isActive === true && 
                 metal.stockStatus === 'in-stock';
        })
        .slice(0, 4);
      
      setFeaturedProducts(featured || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts([]);
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "Bank-level encryption and secure payment processing",
    },
    {
      icon: Award,
      title: "Certified Quality",
      description: "All products certified for purity and authenticity",
    },
    {
      icon: Truck,
      title: "Fast Delivery",
      description: "Insured shipping with tracking to your doorstep",
    },
    {
      icon: TrendingUp,
      title: "Best Prices",
      description: "Competitive pricing updated with real-time market rates",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Invest in <span className="text-[#FBC02E]">Precious Metals</span> with Confidence
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Buy and sell gold, silver, platinum, and palladium at competitive prices. 
                Secure your financial future with tangible assets.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold px-8 shadow-none">
                    Browse Products
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button size="lg" variant="outline" className="border-foreground text-foreground hover:bg-foreground hover:text-background font-semibold px-8">
                    Sell Your Metals
                  </Button>
                </Link>
              </div>
            </div>
            <div>
              <LiveGoldPrice />
            </div>
          </div>
        </div>
      </section>

      {/* Banner Section */}
      <section className="bg-background py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="w-full rounded-lg overflow-hidden">
            <Image 
              src="/banner.jpeg" 
              alt="Riverdale Pawnbrokers Banner"
              width={1200}
              height={400}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Choose Us?</h2>
            <p className="text-muted-foreground text-lg">
              The most trusted platform for precious metal transactions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="bg-card border-border hover:shadow-lg transition-all duration-300">
                  <CardContent className="pt-8 pb-6 px-6">
                    <div className="w-12 h-12 rounded-full bg-[#FBC02E]/10 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-[#FBC02E]" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2 text-lg">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-background py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Featured Products</h2>
            <p className="text-muted-foreground text-lg">
              Handpicked selection of premium precious metals
            </p>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="bg-card border-border animate-pulse overflow-hidden">
                  <div className="w-full aspect-square bg-muted"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                    <div className="h-8 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-10 bg-muted rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : Array.isArray(featuredProducts) && featuredProducts.length > 0 ? (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((product) => {
                  const totalPrice = product.pricePerGram * product.weight;
                  const categoryName = typeof product.category === 'object' ? product.category.name : '';
                  
                return (
                  <Link key={product._id} href={`/products/${product._id}`} className="h-full flex">
                      <Card className="bg-card border-border hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col w-full">
                        <CardContent className="p-0 flex flex-col h-full">
                          {product.images && product.images.length > 0 ? (
                            <div className="w-full aspect-square bg-black overflow-hidden">
                              <Image 
                                src={product.images[0]} 
                                alt={product.name}
                                width={400}
                                height={400}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-full aspect-square bg-black flex items-center justify-center">
                              <span className="text-6xl">💎</span>
                            </div>
                          )}
                          <div className="p-6 flex flex-col flex-1">
                            {categoryName && (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#FBC02E]"></span>
                                <span className="text-xs font-semibold text-[#FBC02E] uppercase tracking-wide">{categoryName}</span>
                              </div>
                            )}
                            <h3 className="font-bold text-foreground mb-2 text-lg">{product.name}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              {product.purity} • {product.weight}{product.weightUnit}
                            </p>
                            <div className="flex items-baseline gap-2 mb-4 mt-auto">
                              <span className="text-2xl font-bold text-foreground">
                                {formatCurrency(totalPrice)}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({formatCurrency(product.pricePerGram)}/{product.weightUnit})
                              </span>
                            </div>
                            <Button 
                              onClick={(e) => {
                                e.preventDefault();
                                addToCart(product, 1);
                                toast.success(`${product.name} added to cart!`);
                              }}
                              disabled={product.stockStatus !== 'in-stock'}
                              className="w-full bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold shadow-none"
                            >
                              Add to Cart
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
              <div className="text-center mt-10">
                <Link href="/products">
                  <Button variant="outline" size="lg" className="border-foreground text-foreground hover:bg-foreground hover:text-background font-semibold px-8">
                    View All Products
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-6">No products available at the moment.</p>
              <Link href="/sell">
                <Button className="bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold">
                  Sell Your Metals
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Sell Your Metals?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Sell your precious metals with us and get the best price for your gold, silver, platinum, and palladium.
          </p>
          <Link href="/sell">
            <Button size="lg" className="bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold px-10 shadow-none">
              Sell Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
