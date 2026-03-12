import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "../../../../lib/models/Category";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("activeOnly") === "true";

    const query: any = { type: "parent" };
    if (activeOnly) {
      query.status = "active";
    }

    const categories = await Category.find(query).lean();

    const result = categories.map((cat: any) => ({
      _id: cat._id.toString(),
      name: cat.name,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching public categories", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 }
    );
  }
}

