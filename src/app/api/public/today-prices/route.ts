import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Metal from "../../../../../lib/models/Metal";
import TodayPrice from "../../../../../lib/models/TodayPrice";

function getTodayRange() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date(startOfToday);
  endOfToday.setDate(endOfToday.getDate() + 1);

  return { startOfToday, endOfToday };
}

export async function GET() {
  try {
    await connectDB();

    const { startOfToday, endOfToday } = getTodayRange();

    const [metals, todayPrices] = await Promise.all([
      Metal.find().lean(),
      TodayPrice.find({
        date: { $gte: startOfToday, $lt: endOfToday },
      }).lean(),
    ]);

    const priceByMetalId = new Map<string, any>();
    for (const price of todayPrices) {
      priceByMetalId.set(price.metalId.toString(), price);
    }

    const result = metals
      .map((metal: any) => {
        const priceDoc = priceByMetalId.get(metal._id.toString());

        // If there is an explicit today price and it's hidden, skip it
        if (priceDoc && priceDoc.showOnSite === false) {
          return null;
        }

        // Use today's price when available, otherwise fall back to basePrice
        const price =
          priceDoc && typeof priceDoc.price === "number"
            ? priceDoc.price
            : typeof metal.basePrice === "number"
            ? metal.basePrice
            : 0;

        if (!price || Number.isNaN(price)) {
          return null;
        }

        const updatedAt =
          priceDoc?.updatedAt ??
          priceDoc?.createdAt ??
          priceDoc?.date ??
          metal.updatedAt ??
          metal.createdAt ??
          new Date();

        return {
          name: metal.name,
          price,
          updatedAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching public today prices", error);
    return NextResponse.json(
      { error: "Failed to load today prices" },
      { status: 500 }
    );
  }
}

