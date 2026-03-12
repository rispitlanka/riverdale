'use client';

import { useEffect, useState } from 'react';

interface PriceData {
  name: string;
  price: number;
  symbol: string;
  updatedAt: string;
  updatedAtReadable: string;
}

const metals = [
  { name: "Gold", symbol: "XAU", icon: "🥇", color: "from-[#9A0156] to-[#c0016d]" },
  { name: "Silver", symbol: "XAG", icon: "🥈", color: "from-gray-400 to-gray-500" },
  { name: "Platinum", symbol: "XPT", icon: "💎", color: "from-blue-400 to-blue-500" },
];

export default function PriceTicker() {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const fetchPromises = metals.map(async (metal) => {
          const response = await fetch(`https://api.gold-api.com/price/${metal.symbol}`);
          const data = await response.json();
          
          return {
            symbol: metal.symbol,
            name: metal.name,
            price: data.price,
            updatedAt: data.updated_at,
            updatedAtReadable: new Date(data.updated_at * 1000).toLocaleString(),
          };
        });

        const results = await Promise.all(fetchPromises);
        const pricesMap = results.reduce((acc, price) => {
          acc[price.symbol] = price;
          return acc;
        }, {} as Record<string, PriceData>);

        setPrices(pricesMap);
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-[#191411] via-[#2F2820] to-[#191411] light:from-gray-50 light:via-white light:to-gray-50 border-y border-[#9A0156]/30 light:border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center">
            <div className="animate-pulse text-gray-400 light:text-gray-600">Loading live prices...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#191411] via-[#2F2820] to-[#191411] light:from-gray-50 light:via-white light:to-gray-50 border-y border-[#9A0156]/30 light:border-gray-200 py-4">
      <div className="flex animate-scroll gap-8">
        {/* Duplicate the list multiple times for seamless loop and full coverage */}
        {[...metals, ...metals, ...metals, ...metals, ...metals, ...metals].map((metal, index) => {
          const price = prices[metal.symbol];
          if (!price) return null;
          
          return (
            <div
              key={`${metal.symbol}-${index}`}
              className="flex items-center gap-3 min-w-[200px] px-4 py-2 bg-[#191411]/50 light:bg-white rounded-lg border border-[#2F2820] light:border-gray-300 shadow-sm"
            >
              <span className="text-2xl">{metal.icon}</span>
              <div>
                <div className="text-xs text-gray-400 light:text-gray-600">{metal.name}</div>
                <div className={`text-sm font-bold bg-gradient-to-r ${metal.color} bg-clip-text text-transparent`}>
                  ${price.price.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
          display: flex;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

