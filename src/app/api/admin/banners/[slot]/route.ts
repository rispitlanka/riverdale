import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Banner, { BannerSlot } from "@/models/Banner";
import { uploadImageToCloudinary } from "../../../../../../lib/cloudinary";

type RouteContext = {
  params: Promise<{ slot: string }>;
};

const VALID_SLOTS: BannerSlot[] = ["header", "middle1", "middle2"];

function isValidSlot(slot: string): slot is BannerSlot {
  return VALID_SLOTS.includes(slot as BannerSlot);
}

export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { slot } = await params;

  if (!isValidSlot(slot)) {
    return NextResponse.json(
      { error: "Invalid banner slot" },
      { status: 400 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await uploadImageToCloudinary(buffer, {
      folder: "reverdale/banners",
      publicIdPrefix: slot,
    });

    await connectDB();

    const updated = await Banner.findOneAndUpdate(
      { slot },
      { imageUrl },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    return NextResponse.json(
      {
        slot: updated.slot,
        imageUrl: updated.imageUrl,
        id: updated._id?.toString() ?? null,
        createdAt: updated.createdAt ?? null,
        updatedAt: updated.updatedAt ?? null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating banner", error);
    return NextResponse.json(
      { error: "Failed to update banner" },
      { status: 500 }
    );
  }
}

