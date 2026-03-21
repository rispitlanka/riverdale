import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Metal from "../../../../../lib/models/Metal";
import TodayPrice from "../../../../../lib/models/TodayPrice";

type TodayPriceRow = {
  metalId?: string;
  price?: number;
  showOnSite?: boolean;
};

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

    const result = metals.map((metal: any) => {
      const priceDoc = priceByMetalId.get(metal._id.toString());

      return {
        metalId: metal._id.toString(),
        name: metal.name,
        basePrice: metal.basePrice,
        todayPrice: priceDoc
          ? {
              id: priceDoc._id.toString(),
              price: priceDoc.price,
              showOnSite: priceDoc.showOnSite,
            }
          : null,
      };
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching today prices", error);
    return NextResponse.json(
      { error: "Failed to load today prices" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectDB();

    const body = (await request.json()) as TodayPriceRow[] | unknown;

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: "Request body must be an array" },
        { status: 400 }
      );
    }

    if (body.length === 0) {
      return NextResponse.json(
        { message: "No prices provided; nothing to update." },
        { status: 200 }
      );
    }

    const { startOfToday } = getTodayRange();

    type ValidRow = {
      objectId: Types.ObjectId;
      price: number;
      showOnSite: boolean;
    };

    /** Last occurrence wins if the same metal appears more than once */
    const rowByMetalId = new Map<string, ValidRow>();

    for (const row of body) {
      const { metalId, price, showOnSite } = row;

      if (!metalId || typeof price !== "number" || Number.isNaN(price)) {
        continue;
      }

      let objectId: Types.ObjectId;
      try {
        objectId = new Types.ObjectId(metalId);
      } catch {
        continue;
      }

      rowByMetalId.set(objectId.toString(), {
        objectId,
        price,
        showOnSite: Boolean(showOnSite),
      });
    }

    const uniqueRows = Array.from(rowByMetalId.values());

    if (uniqueRows.length === 0) {
      return NextResponse.json(
        { message: "No valid price rows to update." },
        { status: 400 }
      );
    }

    const operations = uniqueRows.map((r) => ({
      updateOne: {
        filter: { metalId: r.objectId, date: startOfToday },
        update: {
          $set: {
            metalId: r.objectId,
            price: r.price,
            showOnSite: r.showOnSite,
            date: startOfToday,
          },
        },
        upsert: true,
      },
    })) as Parameters<typeof TodayPrice.collection.bulkWrite>[0];

    const bulkResult = await TodayPrice.collection.bulkWrite(operations, {
      ordered: false,
    });

    // Keep Metal.basePrice in sync with today's price (used for jewellery / product pricing)
    const metalOps = uniqueRows.map((r) => ({
      updateOne: {
        filter: { _id: r.objectId },
        update: { $set: { basePrice: r.price } },
      },
    }));

    const metalBulk = await Metal.collection.bulkWrite(metalOps, {
      ordered: false,
    });

    return NextResponse.json(
      {
        message: "Today prices updated successfully; metal base prices synced.",
        modifiedCount: bulkResult.modifiedCount ?? 0,
        upsertedCount: bulkResult.upsertedCount ?? 0,
        metalsUpdated: metalBulk.modifiedCount ?? 0,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating today prices", error);
    return NextResponse.json(
      { error: "Failed to update today prices" },
      { status: 500 }
    );
  }
}

