'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Suspense } from 'react';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderRef = searchParams.get('orderRef') ?? '';

  /* Stripe payment verification — disabled for initial version
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      fetch('/api/verify-payment', { ... })
        .then(...)
        ...
    }
  }, [searchParams, clearCart]);
  */

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="text-center border-border">
        <CardContent className="py-12">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Your Order Placed Successfully
          </h1>
          <p className="text-lg text-muted-foreground mb-2 max-w-md mx-auto">
            Within hours our team will contact you.
          </p>
          <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
            Thank you for shopping with us. We&apos;ll reach out using the contact details you provided to confirm your order.
          </p>
          {orderRef ? (
            <div className="bg-muted border border-border rounded-lg p-6 mb-8">
              <p className="text-sm text-muted-foreground mb-2">Order reference</p>
              <p className="text-2xl font-bold text-[#9A0156]">{orderRef}</p>
            </div>
          ) : null}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products">
              <Button className="bg-gradient-to-r from-[#9A0156] to-[#c0016d] hover:from-[#c0016d] hover:to-[#d40179] text-white font-bold">
                Continue Shopping
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Go to Homepage</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-foreground">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
