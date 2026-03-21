/**
 * ---------------------------------------------------------------------------
 * STRIPE / PAYMENT GATEWAY — DISABLED FOR INITIAL VERSION
 * ---------------------------------------------------------------------------
 * Restore payment flow by reverting this file from git and wiring the cart
 * `handleCheckout` back to POST /api/create-checkout-session.
 * Requires: STRIPE_SECRET_KEY, Stripe Checkout session creation (see history).
 * ---------------------------------------------------------------------------
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Online card payment is not available in this release. Please use “Place order” on the checkout form — our team will contact you.",
    },
    { status: 503 }
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * ORIGINAL STRIPE IMPLEMENTATION (restore from git when re-enabling payments)
 * ───────────────────────────────────────────────────────────────────────────
 *
 * import { NextRequest, NextResponse } from "next/server";
 * import Stripe from "stripe";
 * import { connectDB } from "@/lib/db";
 * import Order from "../../../../lib/models/Order";
 * import { Types } from "mongoose";
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 *
 * function generateOrderRef() { ... }
 *
 * export async function POST(request: NextRequest) {
 *   await connectDB();
 *   const body = await request.json();
 *   // ... validate items, customerInfo, build orderItems ...
 *   const order = await Order.create({ ... });
 *   const session = await stripe.checkout.sessions.create({ ... });
 *   order.stripeSessionId = session.id;
 *   await order.save();
 *   return NextResponse.json({ url: session.url, orderId, orderRef }, { status: 201 });
 * }
 *
 * ─────────────────────────────────────────────────────────────────────────── */
