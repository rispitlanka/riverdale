import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Jewellery from "@/lib/models/Jewellery";
import Product from "@/lib/models/Product";
import Category from "../../../../../lib/models/Category";

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

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    await connectDB();
    const { id } = await params;

    const jewelleryItem = await Jewellery.findById(id)
      .populate("categoryId", "name")
      .lean();

    if (jewelleryItem) {
      return NextResponse.json(mapItemToPublicProduct(jewelleryItem, "jewellery"), {
        status: 200,
      });
    }

    const productItem = await Product.findById(id).populate("categoryId", "name").lean();
    if (productItem) {
      return NextResponse.json(mapItemToPublicProduct(productItem, "product"), {
        status: 200,
      });
    }

    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching public product by id", error);
    return NextResponse.json(
      { error: "Failed to load product" },
      { status: 500 }
    );
  }
}

