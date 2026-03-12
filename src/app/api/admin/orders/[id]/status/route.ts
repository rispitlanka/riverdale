import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "../../../../../../../lib/models/Order";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const ALLOWED_STATUSES = [
  "new",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    const body = await request.json().catch(() => null);

    if (!body || typeof body.status !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid status in request body" },
        { status: 400 }
      );
    }

    const status = body.status as AllowedStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: "admin",
    });

    await order.save();

    return NextResponse.json(
      {
        id: order._id.toString(),
        orderStatus: order.orderStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating order status", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}

