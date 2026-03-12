'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface PriceData {
  name: string;
  price: number;
  updatedAt: string;
}

const metalIcons: Record<string, string> = {
  Gold: "🥇",
  Silver: "🥈",
  Platinum: "💎",
  Palladium: "⚪",
};

export default function LiveGoldPrice() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPrices();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchPrices();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async (manual = false) => {
    if (manual) {
      setRefreshing(true);
    }

    try {
      const res = await fetch('/api/public/today-prices', {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        console.error('Error fetching today prices:', data);
        setPrices([]);
        if (manual) {
          toast.error('Failed to refresh prices. Please try again.');
        }
      } else {
        setPrices(data);
        if (manual) {
          toast.success('Prices updated successfully');
        }
      }
    } catch (err) {
      console.error('Error fetching today prices:', err);
      if (manual) {
        toast.error('Failed to refresh prices. Please try again.');
      }
    }

    setLoading(false);
    if (manual) {
      setRefreshing(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes > 1 ? 'days' : 'day'} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours > 1 ? 'days' : 'day'} ago`;
    const days = Math.floor(hours / 24);
    return `${days} ${days > 1 ? 'days' : 'day'} ago`;
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-foreground text-xl">
            <TrendingUp className="h-5 w-5 text-[#FBC02E]" />
            Live Metal Prices
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-32" />
        </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border/60 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-foreground text-xl">
          <TrendingUp className="h-5 w-5 text-[#FBC02E]" />
          Live Metal Prices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {prices.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No price data available. Prices will update automatically.
          </p>
        ) : (
          <>
            {prices.map((price) => {
              const icon = metalIcons[price.name] ?? "💰";
              return (
                <div
                  key={price.name}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="font-medium text-foreground">
                      {price.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#FBC02E]">
                      CAD${price.price.toFixed(2)}/g
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Updated {getTimeAgo(price.updatedAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-muted-foreground text-center pt-3">
              Prices per gram • Based on today&apos;s rates
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
