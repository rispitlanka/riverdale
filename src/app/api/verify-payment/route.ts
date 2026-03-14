import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Order from "../../../../lib/models/Order";
import { sendOrderPlacedEmail } from "@/lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const sessionId = body?.sessionId ?? body?.session_id;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing session_id" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { success: false, error: "Payment not completed" },
        { status: 400 }
      );
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Order not found in session" },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        {
          success: true,
          order: {
            orderId: order._id.toString(),
            orderRef: order.orderRef,
            orderNumber: order.orderRef,
          },
        },
        { status: 200 }
      );
    }

    order.paymentStatus = "paid";
    order.stripeSessionId = sessionId;
    order.statusHistory.push({
      status: order.orderStatus,
      changedAt: new Date(),
      changedBy: "stripe",
    });
    await order.save();

    sendOrderPlacedEmail({
      toEmail: order.customerEmail,
      customerName: order.customerName,
      orderRef: order.orderRef,
    }).catch((err) => {
      console.error("Failed to send order confirmation email", err);
    });

    return NextResponse.json(
      {
        success: true,
        order: {
          orderId: order._id.toString(),
          orderRef: order.orderRef,
          orderNumber: order.orderRef,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
