'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { IMetal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  const [product, setProduct] = useState<IMetal | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { addToCart } = useCart();

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/metals/${productId}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        toast.error('Product not found');
        router.push('/products');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-muted rounded mb-8"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-1/3"></div>
              <div className="h-12 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <p className="text-foreground mb-4">Product not found</p>
            <Link href="/products">
              <Button className="bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground">
                Back to Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPrice = product.pricePerGram * product.weight;
  const categoryName = typeof product.category === 'object' ? product.category.name : '';
  const images = product.images && product.images.length > 0 ? product.images : [];
  const mainImage = images[selectedImageIndex] || '/placeholder.jpg';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link 
        href="/products" 
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#FBC02E] mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left Column - Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-black rounded-lg overflow-hidden">
            {mainImage ? (
              <Image
                src={mainImage}
                alt={product.name}
                width={800}
                height={800}
                className="w-full h-full object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">💎</span>
              </div>
            )}
          </div>

          {/* Thumbnail Images */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImageIndex === index
                      ? 'border-[#FBC02E]'
                      : 'border-border hover:border-[#FBC02E]/50'
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product Name Below Thumbnail */}
          {images.length > 0 && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {product.name}
              </p>
            </div>
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className="space-y-6">
          {/* Category Badge */}
          {categoryName && (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FBC02E]"></span>
              <span className="text-sm font-semibold text-[#FBC02E] uppercase tracking-wide">
                {categoryName}
              </span>
            </div>
          )}

          {/* Product Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            {product.name}
          </h1>

          {/* Description */}
          {product.description && (
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              {product.description.split('\n').map((paragraph, index) => {
                // Check if paragraph is a bullet point
                if (paragraph.trim().startsWith('•') || paragraph.trim().startsWith('-')) {
                  return (
                    <div key={index} className="flex items-start gap-2">
                      <span className="text-[#FBC02E] mt-1">•</span>
                      <p>{paragraph.trim().replace(/^[•-]\s*/, '')}</p>
                    </div>
                  );
                }
                return (
                  <p key={index}>{paragraph}</p>
                );
              })}
            </div>
          )}

          {/* Specifications Box */}
          <Card className="bg-muted/50 border-border">
            <CardContent className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purity:</span>
                <span className="font-semibold text-foreground">{product.purity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Weight:</span>
                <span className="font-semibold text-foreground">
                  {product.weight} {product.weightUnit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per gram:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(product.pricePerGram)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Total Price */}
          <div>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {formatCurrency(totalPrice)} total
            </p>
          </div>

          {/* Add to Cart Button */}
          <Button
            onClick={() => {
              addToCart(product, 1);
              toast.success(`${product.name} added to cart!`);
            }}
            disabled={product.stockStatus !== 'in-stock'}
            className="w-full bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold text-lg py-6"
          >
            {product.stockStatus === 'in-stock' ? (
              <>
                🛒 Add to Cart
              </>
            ) : (
              'Out of Stock'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
