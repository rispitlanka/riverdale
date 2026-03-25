'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { getMaxCartQuantityForItem, itemHasStockLimit } from '@/lib/cartStock';

export default function CartPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateQuantity, getCartTotal, getCartTax, clearCart } = useCart();
  const [isCheckout, setIsCheckout] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
  });
  const [loading, setLoading] = useState(false);

  const subtotal = getCartTotal();
  const tax = getCartTax();
  const shippingCost = subtotal > 1000 ? 0 : 25; // Free shipping over $1000
  const total = subtotal + tax + shippingCost;

  const handleQuantityChange = (
    item: (typeof cart)[number],
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      removeFromCart(item._id);
      return;
    }

    const maxQty = getMaxCartQuantityForItem(item);
    if (newQuantity > maxQty) {
      toast.error(`You can order up to ${maxQty} in stock for this item.`);
      updateQuantity(item._id, maxQty);
      return;
    }

    updateQuantity(item._id, newQuantity);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      /** Initial version: place order without payment gateway — team follows up by phone/email */
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerInfo: checkoutForm,
          subtotal,
          tax,
          shippingCost,
          total,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to place order');
        return;
      }

      clearCart();
      const ref = typeof data.orderRef === 'string' ? data.orderRef : '';
      router.push(
        ref
          ? `/checkout/success?orderRef=${encodeURIComponent(ref)}`
          : '/checkout/success'
      );
      toast.success('Order placed successfully');

      /* ─── PAYMENT GATEWAY (Stripe) — restore for paid checkout ───
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          customerInfo: checkoutForm,
          subtotal,
          tax,
          shippingCost,
          total,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Failed to create checkout session');
        return;
      }
      if (data.url) {
        clearCart();
        window.location.href = data.url;
      } else {
        toast.error('Invalid checkout response');
      }
      ─────────────────────────────────────────────────────────────── */
    } catch (error) {
      console.error('Error during checkout:', error);
      toast.error('Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      // Test
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your Cart is Empty</h2>
            <p className="text-muted-foreground mb-6">Add some precious metals to your cart to get started</p>
            <Link href="/products">
              <Button className="bg-gradient-to-r from-[#9A0156] to-[#c0016d] hover:from-[#c0016d] hover:to-[#d40179] text-white font-bold">
                Browse Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isCheckout) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setIsCheckout(false)}
            className="mb-4"
          >
            ← Back to Cart
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Checkout</h1>
          <p className="text-muted-foreground">
            Enter your details — our team will contact you within hours to confirm your order.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Checkout Form */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCheckout} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Full Name</Label>
                  <Input
                    id="customerName"
                    required
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    required
                    value={checkoutForm.customerEmail}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerEmail: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    required
                    value={checkoutForm.customerPhone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    required
                    value={checkoutForm.street}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, street: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      value={checkoutForm.city}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      required
                      value={checkoutForm.state}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, state: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      required
                      value={checkoutForm.zipCode}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, zipCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      required
                      value={checkoutForm.country}
                      onChange={(e) => setCheckoutForm({ ...checkoutForm, country: e.target.value })}
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#9A0156] to-[#c0016d] hover:from-[#c0016d] hover:to-[#d40179] text-white font-bold py-6 text-lg"
                >
                  {loading ? 'Placing order...' : `Place order (${formatCurrency(total)})`}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.map((item) => (
                <div key={item._id} className="flex gap-3 pb-3 border-b border-border">
                  {item.images && item.images[0] ? (
                    <div className="relative w-16 h-16 flex-shrink-0">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                      💎
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="text-foreground font-semibold">{item.name}</div>
                    {item.sku ? (
                      <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                    ) : null}
                    <div className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                      {itemHasStockLimit(item) ? (
                        <span className="text-muted-foreground/80"> / {getMaxCartQuantityForItem(item)} max</span>
                      ) : null}
                    </div>
                    <div className="text-sm text-[#9A0156]">
                      {formatCurrency(item.pricePerGram * item.weight * item.quantity)}
                    </div>
                  </div>
                </div>
              ))}
              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-foreground pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-[#9A0156]">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-muted-foreground">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item._id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {item.images && item.images[0] ? (
                    <div className="relative w-24 h-24 flex-shrink-0">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-muted rounded flex items-center justify-center text-3xl">
                      💎
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{item.purity} • {item.weight}{item.weightUnit}</p>
                    {item.sku ? (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-muted-foreground">SKU:</span>
                        <span className="text-sm text-foreground">{item.sku}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-foreground font-semibold w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={item.quantity >= getMaxCartQuantityForItem(item)}
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        {itemHasStockLimit(item) ? (
                          <span className="text-xs text-muted-foreground">
                            {getMaxCartQuantityForItem(item)} in stock
                          </span>
                        ) : null}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#9A0156]">
                          {formatCurrency(item.pricePerGram * item.weight * item.quantity)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(item.pricePerGram)}/g
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item._id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <Button
            variant="outline"
            onClick={clearCart}
            className="w-full text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
          >
            Clear Cart
          </Button>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}</span>
                </div>
                {/* {subtotal > 1000 && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    ✓ Free shipping on orders over $1,000
                  </div>
                )} */}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-xl font-bold text-foreground mb-4">
                  <span>Total</span>
                  <span className="text-[#9A0156]">{formatCurrency(total)}</span>
                </div>
                <Button
                  onClick={() => setIsCheckout(true)}
                  className="w-full bg-gradient-to-r from-[#9A0156] to-[#c0016d] hover:from-[#c0016d] hover:to-[#d40179] text-white font-bold py-6 text-lg"
                >
                  Proceed to Checkout
                </Button>
              </div>
              <div className="pt-4 border-t border-border text-center">
                <Link href="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

