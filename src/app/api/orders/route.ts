import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "../../../../lib/models/Order";
import Product from "../../../../lib/models/Product";
import Jewellery from "../../../../lib/models/Jewellery";
import { Types } from "mongoose";
import { sendOrderPlacedEmail } from "@/lib/mailer";

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
      return NextResponse.json(
        { error: "Cart is empty" },
        { status: 400 }
      );
    }

    if (!customerInfo?.customerName || !customerInfo?.customerEmail || !customerInfo?.customerPhone) {
      return NextResponse.json(
        { error: "Customer name, email and phone are required" },
        { status: 400 }
      );
    }

    for (const raw of items) {
      const kind =
        raw?.kind === "jewellery" || raw?.kind === "product" ? raw.kind : "product";
      const qty = Math.floor(Number(raw?.quantity) || 0);
      if (qty < 1) {
        return NextResponse.json(
          { error: "Each item must have a valid quantity" },
          { status: 400 }
        );
      }

      let available = 0;
      try {
        const doc =
          kind === "jewellery"
            ? await Jewellery.findById(raw._id).select("stockQuantity inStock").lean()
            : await Product.findById(raw._id).select("stockQuantity inStock").lean();
        if (doc) {
          const row = doc as { stockQuantity?: number; inStock?: boolean };
          available =
            typeof row.stockQuantity === "number"
              ? Math.max(0, Math.floor(row.stockQuantity))
              : row.inStock
                ? 1
                : 0;
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid product in cart" },
          { status: 400 }
        );
      }

      if (qty > available) {
        const name = typeof raw?.name === "string" ? raw.name : "This item";
        return NextResponse.json(
          {
            error: `${name}: only ${available} available in stock (you requested ${qty}).`,
          },
          { status: 400 }
        );
      }
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
        itemType: item.kind === "jewellery" || item.kind === "product" ? item.kind : "product",
        name: item.name,
        sku: typeof item.sku === "string" ? item.sku : "",
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

    const order = await Order.create({
      orderRef: generateOrderRef(),
      customerId: new Types.ObjectId(), // anonymous / guest
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

    // Send confirmation email (non-blocking)
    sendOrderPlacedEmail({
      toEmail: customerInfo.customerEmail,
      customerName: customerInfo.customerName,
      orderRef: order.orderRef,
    }).catch((err) => {
      console.error("Failed to send order email", err);
    });

    return NextResponse.json(
      {
        orderId: order._id.toString(),
        orderRef: order.orderRef,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

