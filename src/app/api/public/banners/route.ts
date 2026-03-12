import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Banner, { BannerSlot } from "@/models/Banner";

const ALL_SLOTS: BannerSlot[] = ["header", "middle1", "middle2"];

/**
 * Public API: returns banner image URLs by slot for the client homepage.
 * No authentication required.
 */
export async function GET() {
  try {
    await connectDB();

    let banners = await Banner.find().lean();

    if (banners.length === 0) {
      await Banner.insertMany(
        ALL_SLOTS.map((slot) => ({
          slot,
          imageUrl: "",
        }))
      );
      banners = await Banner.find().lean();
    }

    const bySlot = new Map<string, { slot: string; imageUrl: string }>();
    for (const banner of banners) {
      bySlot.set(banner.slot, {
        slot: banner.slot,
        imageUrl: banner?.imageUrl ?? "",
      });
    }

    const result = ALL_SLOTS.map((slot) => {
      const banner = bySlot.get(slot);
      return {
        slot,
        imageUrl: banner?.imageUrl ?? "",
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching public banners", error);
    return NextResponse.json(
      { error: "Failed to load banners" },
      { status: 500 }
    );
  }
}
