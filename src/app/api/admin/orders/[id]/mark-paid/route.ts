import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Order from "../../../../../../../lib/models/Order";
import { reduceStockForOrder } from "@/lib/stock";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.paymentStatus === "paid") {
      return NextResponse.json(
        { message: "Order is already marked as paid.", paymentStatus: "paid" },
        { status: 200 }
      );
    }

    const stockResult = await reduceStockForOrder(order);
    if (!stockResult.ok) {
      return NextResponse.json(
        { error: stockResult.error || "Unable to reduce stock for this order" },
        { status: 400 }
      );
    }

    order.paymentStatus = "paid";
    await order.save();

    return NextResponse.json(
      {
        message: "Order marked as paid.",
        paymentStatus: order.paymentStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error marking order paid", error);
    return NextResponse.json(
      { error: "Failed to update payment status" },
      { status: 500 }
    );
  }
}
