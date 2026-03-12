'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ICategory, IMetal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { toast } from 'sonner';

export default function ProductsPage() {
  const [metals, setMetals] = useState<IMetal[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [filteredMetals, setFilteredMetals] = useState<IMetal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterMetals();
  }, [metals, selectedCategory, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [metalsRes, categoriesRes] = await Promise.all([
        fetch('/api/products', {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        }),
        fetch('/api/categories?activeOnly=true', {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
        }),
      ]);

      const metalsData = await metalsRes.json();
      const categoriesData = await categoriesRes.json();

      // Validate data is an array
      const validMetals = Array.isArray(metalsData) ? metalsData : [];
      const validCategories = Array.isArray(categoriesData) ? categoriesData : [];

      setMetals(validMetals);
      setCategories(validCategories);
      setFilteredMetals(validMetals);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMetals([]);
      setCategories([]);
      setFilteredMetals([]);
      setLoading(false);
    }
  };

  const filterMetals = () => {
    // Ensure metals is an array
    if (!Array.isArray(metals)) {
      setFilteredMetals([]);
      return;
    }

    let filtered = metals;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((metal) => {
        const categoryId = typeof metal.category === 'string' 
          ? metal.category 
          : metal.category?._id;
        return categoryId === selectedCategory;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter((metal) =>
        metal?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metal?.purity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        metal?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMetals(filtered || []);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Product Catalog</h1>
          <p className="text-muted-foreground text-lg">Browse our collection of precious metals</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="bg-card border-border animate-pulse overflow-hidden h-full flex flex-col">
              <div className="w-full aspect-square bg-muted"></div>
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-muted rounded w-1/2 mb-4 mt-auto"></div>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Product Catalog</h1>
        <p className="text-muted-foreground text-lg">Browse our collection of precious metals</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, purity, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid */}
      {!Array.isArray(filteredMetals) || filteredMetals.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 px-6 text-center text-muted-foreground">
            No products found matching your criteria
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMetals.map((metal) => {
            const totalPrice = metal.pricePerGram * metal.weight;
            const categoryName =
              metal.category && typeof metal.category === "object"
                ? metal.category.name
                : "";
            
            return (
              <Link key={metal._id} href={`/products/${metal._id}`} className="h-full flex">
                <Card className="bg-card border-border hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col w-full">
                  <CardContent className="p-0 flex flex-col h-full">
                    {metal.images && Array.isArray(metal.images) && metal.images.length > 0 ? (
                      <div className="w-full aspect-square bg-black overflow-hidden">
                        <Image
                          src={metal.images[0]}
                          alt={metal.name}
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
                      <h3 className="font-bold text-foreground mb-2 text-lg">{metal.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {metal.purity} • {metal.weight}{metal.weightUnit}
                      </p>
                      {metal.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {metal.description}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2 mb-4 mt-auto">
                        <span className="text-2xl font-bold text-foreground">
                          {formatCurrency(totalPrice)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          ({formatCurrency(metal.pricePerGram)}/{metal.weightUnit})
                        </span>
                      </div>
                      <Button
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.preventDefault();
                          addToCart(metal, 1);
                          toast.success(`${metal.name} added to cart!`);
                        }}
                        disabled={metal.stockStatus !== 'in-stock'}
                        className="w-full bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold shadow-none"
                      >
                        {metal.stockStatus === 'in-stock' ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

