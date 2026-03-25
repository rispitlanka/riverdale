'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { IMetal } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';
import { toast } from 'sonner';

interface IJewelleryItem {
  id: string;
  name: string;
  sku?: string;
  metalId: string | null;
  metalName: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subCategoryId: string | null;
  subCategoryName: string | null;
  stonePrice: number;
  weight: number;
  purity: string;
  unit: string;
  description?: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity?: number;
  taxIncluded: boolean;
  taxPercent?: number | null;
  finalPrice: number;
}

function jewelleryToCartItem(item: IJewelleryItem): IMetal {
  const stockQuantity =
    typeof item.stockQuantity === 'number'
      ? item.stockQuantity
      : item.inStock
        ? 1
        : 0;
  return {
    _id: item.id,
    name: item.name,
    sku: item.sku ?? "",
    purity: item.purity,
    weight: item.weight,
    weightUnit: item.unit,
    pricePerGram: item.weight > 0 ? item.finalPrice / item.weight : item.finalPrice,
    images: item.imageUrl ? [item.imageUrl] : [],
    description: item.description,
    stockStatus: item.inStock ? 'in-stock' : 'out-of-stock',
    stockQuantity,
    kind: 'jewellery',
    category: item.categoryId
      ? { _id: item.categoryId, name: item.categoryName ?? '' }
      : null,
    taxIncluded: item.taxIncluded,
    taxPercent: item.taxPercent ?? null,
  };
}

export default function JewelleryPage() {
  const [items, setItems] = useState<IJewelleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<IJewelleryItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, selectedCategory, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/jewellery', {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      const validItems: IJewelleryItem[] = Array.isArray(data) ? data : [];

      setItems(validItems);
      setFilteredItems(validItems);

      const uniqueCategories = Array.from(
        new Map(
          validItems
            .filter((i) => i.categoryId && i.categoryName)
            .map((i) => [i.categoryId!, { id: i.categoryId!, name: i.categoryName! }])
        ).values()
      );
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching jewellery:', error);
      setItems([]);
      setFilteredItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    if (!Array.isArray(items)) {
      setFilteredItems([]);
      return;
    }

    let filtered = items;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.categoryId === selectedCategory);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.purity?.toLowerCase().includes(q) ||
          item.metalName?.toLowerCase().includes(q) ||
          item.categoryName?.toLowerCase().includes(q)
      );
    }

    setFilteredItems(filtered);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">Products Catalog</h1>
          <p className="text-muted-foreground text-lg">Browse our jewellery collection</p>
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
        <h1 className="text-4xl font-bold mb-4 text-foreground">Products Catalog</h1>
        <p className="text-muted-foreground text-lg">Browse our jewellery collection</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by name, purity, metal or category..."
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
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 px-6 text-center text-muted-foreground">
            No items found matching your criteria
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="bg-card border-border hover:shadow-xl transition-all duration-300 overflow-hidden h-full flex flex-col"
            >
              <CardContent className="p-0 flex flex-col h-full">
                {item.imageUrl ? (
                  <div className="w-full aspect-square bg-black overflow-hidden">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-square bg-black flex items-center justify-center">
                    <span className="text-6xl">💍</span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {item.categoryName && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FBC02E]"></span>
                      <span className="text-xs font-semibold text-[#FBC02E] uppercase tracking-wide">
                        {item.categoryName}
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-foreground mb-2 text-lg">{item.name}</h3>

                  <p className="text-sm text-muted-foreground mb-1">
                    {item.purity} • {item.weight} {item.unit}
                  </p>

                  {item.metalName && (
                    <p className="text-xs text-muted-foreground mb-2">Metal: {item.metalName}</p>
                  )}

                  {item.subCategoryName && (
                    <p className="text-xs text-muted-foreground mb-2">Style: {item.subCategoryName}</p>
                  )}

                  {item.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2 mb-1 mt-auto">
                    <span className="text-2xl font-bold text-foreground">
                      {formatCurrency(item.finalPrice)}
                    </span>
                  </div>

                  {item.taxIncluded && item.taxPercent && item.taxPercent > 0 && (
                    <p className="text-xs text-muted-foreground mb-3">
                      +{item.taxPercent}% tax applied at checkout
                    </p>
                  )}

                  <Button
                    onClick={() => {
                      const addedAll = addToCart(jewelleryToCartItem(item), 1);
                      if (addedAll) {
                        toast.success(`${item.name} added to cart!`);
                      } else {
                        toast.error('Maximum quantity in cart for this item (stock limit).');
                      }
                    }}
                    disabled={!item.inStock}
                    className="w-full bg-[#FBC02E] hover:bg-[#E5AD1F] text-foreground font-semibold shadow-none"
                  >
                    {item.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
