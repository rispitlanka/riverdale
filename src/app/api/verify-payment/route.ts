/**
 * ---------------------------------------------------------------------------
 * STRIPE PAYMENT VERIFICATION — DISABLED FOR INITIAL VERSION
 * ---------------------------------------------------------------------------
 * This route confirmed Stripe Checkout sessions after redirect to
 * /checkout/success?session_id=...
 * Restore from git when payment gateway is re-enabled.
 * ---------------------------------------------------------------------------
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: "Payment verification is disabled in this release.",
    },
    { status: 503 }
  );
}

/* ───────────────────────────────────────────────────────────────────────────
 * ORIGINAL IMPLEMENTATION (restore from git)
 * ───────────────────────────────────────────────────────────────────────────
 *
 * import { NextRequest, NextResponse } from "next/server";
 * import Stripe from "stripe";
 * import { connectDB } from "@/lib/db";
 * import Order from "../../../../lib/models/Order";
 * import { sendOrderPlacedEmail } from "@/lib/mailer";
 *
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 *
 * export async function POST(request: NextRequest) {
 *   const session = await stripe.checkout.sessions.retrieve(sessionId, ...);
 *   // ... mark order paid, send email ...
 * }
 *
 * ─────────────────────────────────────────────────────────────────────────── */
