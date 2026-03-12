import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SellRequest from "@/lib/models/Request";

type RouteContext = { params: Promise<{ id: string }> };

const VALID_STATUSES = [
  "submitted",
  "under_review",
  "quoted",
  "confirmed",
  "in_process",
  "completed",
  "rejected",
] as const;

/**
 * PATCH – update sell request status (and optional quotedPrice, adminNotes).
 */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const body = await request.json();
    const { status, quotedPrice, adminNotes } = body;

    const updates: Record<string, unknown> = {};
    if (typeof status === "string" && VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      updates.status = status;
      if (status === "under_review") {
        updates.reviewedAt = new Date();
      }
      if (status === "completed") {
        updates.completedAt = new Date();
      }
    }
    if (quotedPrice !== undefined) {
      const n = Number(quotedPrice);
      updates.quotedPrice = Number.isNaN(n) ? undefined : n;
    }
    if (adminNotes !== undefined) {
      updates.adminNotes = String(adminNotes);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid updates" }, { status: 400 });
    }

    await connectDB();

    const doc = await SellRequest.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("category", "name")
      .lean();

    if (!doc) {
      return NextResponse.json({ error: "Sell request not found" }, { status: 404 });
    }

    const docWithPopulated = doc as typeof doc & { category?: { name: string } | null };
    const categoryName =
      docWithPopulated.category && typeof docWithPopulated.category === "object" && "name" in docWithPopulated.category
        ? docWithPopulated.category.name
        : undefined;

    const result = {
      ...doc,
      _id: doc._id?.toString(),
      categoryName,
      category: undefined,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error updating sell request", error);
    return NextResponse.json(
      { error: "Failed to update sell request" },
      { status: 500 }
    );
  }
}

/**
 * GET – fetch full sell request details for admin modal.
 */
export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await connectDB();

    const doc = await SellRequest.findById(id)
      .populate("category", "name")
      .lean();

    if (!doc) {
      return NextResponse.json({ error: "Sell request not found" }, { status: 404 });
    }

    const docWithPopulated = doc as typeof doc & { category?: { name: string } | null };
    const categoryName =
      docWithPopulated.category && typeof docWithPopulated.category === "object" && "name" in docWithPopulated.category
        ? docWithPopulated.category.name
        : undefined;

    const detail = {
      ...doc,
      _id: doc._id?.toString(),
      categoryName,
      category: undefined,
    };

    return NextResponse.json(detail, { status: 200 });
  } catch (error) {
    console.error("Error fetching sell request", error);
    return NextResponse.json(
      { error: "Failed to load sell request" },
      { status: 500 }
    );
  }
}
