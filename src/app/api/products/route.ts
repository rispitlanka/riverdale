import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Jewellery from "../../../../lib/models/Jewellery";
import Product from "../../../../lib/models/Product";
import Category from "../../../../lib/models/Category";

function mapItemToPublicProduct(item: any, kind: "jewellery" | "product") {
  const weight = typeof item.weight === "number" && !Number.isNaN(item.weight) ? item.weight : 0;
  const finalPrice =
    typeof item.finalPrice === "number" && !Number.isNaN(item.finalPrice)
      ? item.finalPrice
      : 0;

  const pricePerGram = weight > 0 ? finalPrice / weight : finalPrice;

  const category =
    item.categoryId && typeof item.categoryId === "object"
      ? {
          _id: item.categoryId._id?.toString?.() ?? item.categoryId.toString(),
          name: item.categoryId.name ?? "",
        }
      : item.categoryId
      ? { _id: item.categoryId.toString(), name: "" }
      : null;

  const images: string[] = item.imageUrl ? [item.imageUrl] : [];

  return {
    _id: item._id.toString(),
    name: item.name,
    description: item.description ?? "",
    purity: item.purity ?? "",
    weight,
    weightUnit: item.unit ?? "g",
    pricePerGram,
    images,
    category,
    stockStatus: item.inStock ? "in-stock" : "out-of-stock",
    kind,
  };
}

export async function GET() {
  try {
    await connectDB();

    const [jewelleryItems, productItems] = await Promise.all([
      Jewellery.find()
        .populate("categoryId", "name")
        .lean(),
      Product.find()
        .populate("categoryId", "name")
        .lean(),
    ]);

    const jewellery = jewelleryItems.map((item: any) =>
      mapItemToPublicProduct(item, "jewellery")
    );
    const products = productItems.map((item: any) =>
      mapItemToPublicProduct(item, "product")
    );

    const all = [...jewellery, ...products];

    return NextResponse.json(all, { status: 200 });
  } catch (error) {
    console.error("Error fetching public products", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

