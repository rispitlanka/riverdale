import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "../../../../../../../lib/models/Order";
import { getStripe, getAppOrigin } from "@/lib/stripe";
import { sendStripePaymentLinkEmail } from "@/lib/mailer";

const PAYMENT_LINK_EXPIRY_MINUTES = 30;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured (STRIPE_SECRET_KEY)." },
        { status: 503 }
      );
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const requestedTotal =
      typeof body?.totalAmount === "number" && Number.isFinite(body.totalAmount)
        ? body.totalAmount
        : undefined;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Order is already marked as paid." },
        { status: 400 }
      );
    }

    const total =
      requestedTotal !== undefined ? Number(requestedTotal) : Number(order.totalAmount);
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json(
        { error: "Order total is invalid for payment." },
        { status: 400 }
      );
    }

    const amountCents = Math.round(total * 100);
    if (amountCents < 50) {
      return NextResponse.json(
        {
          error:
            "Order total is below the minimum charge amount (CA$0.50). Mark as paid manually or adjust the order.",
        },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin = getAppOrigin();
    const expiresAt = Math.floor(Date.now() / 1000) + PAYMENT_LINK_EXPIRY_MINUTES * 60;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Order ${order.orderRef}`,
              description: `${order.items?.length ?? 0} item(s) — Riverdale Pawn Brokers`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/success?payment_cancelled=1`,
      customer_email: order.customerEmail,
      metadata: {
        orderId: order._id.toString(),
        orderRef: order.orderRef,
      },
      expires_at: expiresAt,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 500 }
      );
    }

    order.stripeSessionId = session.id;
    if (requestedTotal !== undefined) {
      order.totalAmount = total;
    }
    await order.save();

    const amountLabel = `CA$${total.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    try {
      await sendStripePaymentLinkEmail({
        toEmail: order.customerEmail,
        customerName: order.customerName,
        orderRef: order.orderRef,
        amountLabel,
        paymentUrl: session.url,
        expiresInMinutes: PAYMENT_LINK_EXPIRY_MINUTES,
      });
    } catch (mailErr: unknown) {
      console.error("Failed to send payment link email", mailErr);
      const reason =
        mailErr instanceof Error ? mailErr.message : "Unknown email error";
      return NextResponse.json(
        {
          error: `Checkout link was created but the email could not be sent. ${reason}`,
          checkoutUrl: session.url,
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        message: `Payment link sent to ${order.customerEmail}. It expires in ${PAYMENT_LINK_EXPIRY_MINUTES} minutes.`,
        expiresInMinutes: PAYMENT_LINK_EXPIRY_MINUTES,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error creating payment link", error);
    const message =
      error instanceof Error ? error.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
