import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "../../../../lib/models/Order";
import { Types } from "mongoose";

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

    const orderItems = items.map((item: any) => {
      const quantity = Number(item.quantity) || 1;
      const unitPrice = Number(item.pricePerGram) * Number(item.weight) || 0;
      const subtotal = unitPrice * quantity;

      return {
        itemId: new Types.ObjectId(item._id),
        itemType: item.kind === "jewellery" || item.kind === "product" ? item.kind : "product",
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

    const order = await Order.create({
      orderRef: generateOrderRef(),
      customerId: new Types.ObjectId(), // anonymous / guest
      customerName: customerInfo.customerName,
      customerEmail: customerInfo.customerEmail,
      customerPhone: customerInfo.customerPhone,
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

