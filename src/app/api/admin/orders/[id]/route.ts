import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "../../../../../../lib/models/Order";
import type { PaymentStatus, OrderStatus } from "../../../../../../lib/models/Order";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeDate(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    const order: any = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: order._id.toString(),
        orderRef: order.orderRef ?? null,
        customerName: order.customerName ?? "",
        customerEmail: order.customerEmail ?? "",
        customerPhone: order.customerPhone ?? "",
        totalAmount: Number(order.totalAmount ?? 0),
        paymentStatus: (order.paymentStatus ?? "pending") as PaymentStatus,
        orderStatus: (order.orderStatus ?? "new") as OrderStatus,
        createdAt: normalizeDate(order.createdAt),
        updatedAt: normalizeDate(order.updatedAt),
        // If present in DB (some flows may store it), include it.
        shippingAddress: order.shippingAddress ?? null,
        address: order.address ?? null,
        items: Array.isArray(order.items) ? order.items : [],
        statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching order detail", error);
    return NextResponse.json(
      { error: "Failed to load order details" },
      { status: 500 }
    );
  }
}

