'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
      fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.order) {
            setOrderNumber(data.order.orderNumber);
            clearCart(); // Clear the cart after successful payment
          }
        })
        .catch(error => console.error('Error verifying payment:', error))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [searchParams, clearCart]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="text-center">
        <CardContent className="py-12">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Payment Successful!</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your purchase. Your order has been confirmed.
          </p>
          {orderNumber && (
            <div className="bg-muted border border-border rounded-lg p-6 mb-6">
              <p className="text-sm text-muted-foreground mb-2">Your Order Number</p>
              <p className="text-2xl font-bold text-[#9A0156]">{orderNumber}</p>
            </div>
          )}
          <p className="text-sm text-muted-foreground mb-8">
            A confirmation email has been sent to your email address with order details.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="bg-gradient-to-r from-[#9A0156] to-[#c0016d] hover:from-[#c0016d] hover:to-[#d40179] text-white font-bold">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                Go to Homepage
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-foreground">Loading...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

