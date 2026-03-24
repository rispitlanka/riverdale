import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Jewellery from "../../../../lib/models/Jewellery";

export async function GET() {
  try {
    await connectDB();

    const items = await Jewellery.find()
      .populate("metalId", "name basePrice")
      .populate("categoryId", "name")
      .populate("subCategoryId", "name makePrice")
      .lean();

    const result = items.map((item: any) => ({
      id: item._id.toString(),
      name: item.name,
      sku: item.sku ?? "",
      metalId: item.metalId?._id?.toString() ?? item.metalId?.toString() ?? null,
      metalName: item.metalId?.name ?? null,
      categoryId:
        item.categoryId?._id?.toString() ?? item.categoryId?.toString() ?? null,
      categoryName: item.categoryId?.name ?? null,
      subCategoryId:
        item.subCategoryId?._id?.toString() ??
        item.subCategoryId?.toString() ??
        null,
      subCategoryName: item.subCategoryId?.name ?? null,
      stonePrice: item.stonePrice,
      weight: item.weight,
      purity: item.purity,
      unit: item.unit,
      description: item.description,
      imageUrl: item.imageUrl,
      inStock: item.inStock,
      taxIncluded: item.taxIncluded ?? false,
      taxPercent: item.taxPercent ?? null,
      finalPrice: item.finalPrice,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching jewellery for client", error);
    return NextResponse.json(
      { error: "Failed to load jewellery" },
      { status: 500 }
    );
  }
}
