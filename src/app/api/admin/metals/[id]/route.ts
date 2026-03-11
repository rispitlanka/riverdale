import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Metal from "../../../../../../lib/models/Metal";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();

    if (
      updates.basePrice !== undefined &&
      (typeof updates.basePrice !== "number" || Number.isNaN(updates.basePrice))
    ) {
      return NextResponse.json(
        { error: "basePrice must be a valid number" },
        { status: 400 }
      );
    }

    const updated = await Metal.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Metal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        id: updated._id.toString(),
        name: updated.name,
        basePrice: updated.basePrice,
        imageUrl: updated.imageUrl,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating metal", error);

    if (error?.code === 11000) {
      return NextResponse.json(
        { error: "A metal with this name already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update metal" },
      { status: 500 }
    );
  }
}

