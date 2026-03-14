import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { connectDB } from "@/lib/db";
import Order from "../../../../lib/models/Order";
import { Types } from "mongoose";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function generateOrderRef() {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${y}${m}${d}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured" },
        { status: 500 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      items,
      customerInfo,
      subtotal,
      tax,
      shippingCost,
      total,
    } = body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (
      !customerInfo?.customerName ||
      !customerInfo?.customerEmail ||
      !customerInfo?.customerPhone
    ) {
      return NextResponse.json(
        { error: "Customer name, email and phone are required" },
        { status: 400 }
      );
    }

    const shippingAddress = customerInfo
      ? {
          street: String(customerInfo.street ?? "").trim(),
          city: String(customerInfo.city ?? "").trim(),
          state: String(customerInfo.state ?? "").trim(),
          zipCode: String(customerInfo.zipCode ?? "").trim(),
          country: String(customerInfo.country ?? "").trim(),
        }
      : null;

    const orderItems = items.map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.pricePerGram) * Number(item.weight) || 0;
      const subtotal = unitPrice * quantity;

      return {
        itemId: new Types.ObjectId(item._id),
        itemType:
          item.kind === "jewellery" || item.kind === "product"
            ? item.kind
            : "product",
        name: item.name,
        metalType: item.metalType ?? "",
        quantity,
        unitPrice,
        subtotal,
      };
    });

    const computedTotal =
      typeof total === "number" && !Number.isNaN(total)
        ? total
        : orderItems.reduce((sum: number, it: any) => sum + it.subtotal, 0);

    // Amount in cents (smallest currency unit)
    const amountCents = Math.round(computedTotal * 100);
    if (amountCents < 50) {
      return NextResponse.json(
        { error: "Minimum order amount is $0.50" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      "http://localhost:3000";
    const origin = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;

    const order = await Order.create({
      orderRef: generateOrderRef(),
      customerId: new Types.ObjectId(),
      customerName: customerInfo.customerName,
      customerEmail: customerInfo.customerEmail,
      customerPhone: customerInfo.customerPhone,
      shippingAddress,
      items: orderItems,
      totalAmount: computedTotal,
      paymentStatus: "pending",
      orderStatus: "new",
      statusHistory: [
        {
          status: "new",
          changedAt: new Date(),
          changedBy: "website",
        },
      ],
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: `Order ${order.orderRef}`,
              description: `${items.length} item(s) - Reverdale`,
              images:
                items[0]?.images?.[0] ? [items[0].images[0]] : undefined,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order._id.toString()}`,
      cancel_url: `${origin}/cart`,
      customer_email: customerInfo.customerEmail,
      metadata: {
        orderId: order._id.toString(),
        orderRef: order.orderRef,
      },
    });

    order.stripeSessionId = session.id;
    await order.save();

    return NextResponse.json(
      {
        url: session.url,
        orderId: order._id.toString(),
        orderRef: order.orderRef,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating checkout session", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
