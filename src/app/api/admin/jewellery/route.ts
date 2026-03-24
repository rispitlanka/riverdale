import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Jewellery from "../../../../../lib/models/Jewellery";
import Metal from "../../../../../lib/models/Metal";
import Category from "../../../../../lib/models/Category";
import { uploadImageToCloudinary } from "../../../../../lib/cloudinary";

type CalculateFinalPriceArgs = {
  metalId: string;
  subCategoryId?: string | null;
  weight: number;
  stonePrice: number;
  taxIncluded: boolean;
  taxPercent?: number | null;
};

async function calculateFinalPrice({
  metalId,
  subCategoryId,
  weight,
  stonePrice,
  taxIncluded,
  taxPercent,
}: CalculateFinalPriceArgs): Promise<number> {
  const metal = await Metal.findById(metalId).lean();
  if (!metal) {
    throw new Error("Invalid metalId");
  }

  let makePrice = 0;

  if (subCategoryId) {
    const subCategory = await Category.findById(subCategoryId).lean();
    if (!subCategory) {
      throw new Error("Invalid subCategoryId");
    }
    makePrice = typeof subCategory.makePrice === "number" ? subCategory.makePrice : 0;
  }

  const metalBasePrice =
    typeof metal.basePrice === "number" && !Number.isNaN(metal.basePrice)
      ? metal.basePrice
      : 0;

  const numericStonePrice =
    typeof stonePrice === "number" && !Number.isNaN(stonePrice) ? stonePrice : 0;

  const numericWeight =
    typeof weight === "number" && !Number.isNaN(weight) ? weight : 0;

  const finalPrice = (metalBasePrice + makePrice) * numericWeight + numericStonePrice;

  return finalPrice;
}

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
      metalBasePrice: item.metalId?.basePrice ?? null,
      categoryId:
        item.categoryId?._id?.toString() ?? item.categoryId?.toString() ?? null,
      categoryName: item.categoryId?.name ?? null,
      subCategoryId:
        item.subCategoryId?._id?.toString() ?? item.subCategoryId?.toString() ?? null,
      subCategoryName: item.subCategoryId?.name ?? null,
      subCategoryMakePrice: item.subCategoryId?.makePrice ?? null,
      stonePrice: item.stonePrice,
      weight: item.weight,
      purity: item.purity,
      unit: item.unit,
      description: item.description,
      imageUrl: item.imageUrl,
      inStock: item.inStock,
      stockQuantity:
        typeof item.stockQuantity === "number"
          ? item.stockQuantity
          : item.inStock
          ? 1
          : 0,
      taxIncluded: item.taxIncluded,
      taxPercent: item.taxPercent,
      finalPrice: item.finalPrice,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching jewellery", error);
    return NextResponse.json(
      { error: "Failed to load jewellery" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    const {
      name,
      sku,
      metalId,
      categoryId,
      subCategoryId,
      stonePrice = 0,
      weight,
      purity,
      unit,
      description,
      imageUrl,
      inStock = true,
      stockQuantity,
      taxIncluded = true,
      taxPercent = null,
    } = body;

    if (!name || !metalId || !categoryId || !weight || !purity || !unit) {
      return NextResponse.json(
        {
          error:
            "name, metalId, categoryId, weight, purity and unit are required",
        },
        { status: 400 }
      );
    }

    if (typeof weight !== "number" || Number.isNaN(weight)) {
      return NextResponse.json(
        { error: "weight must be a valid number" },
        { status: 400 }
      );
    }

    if (stonePrice !== undefined &&
      (typeof stonePrice !== "number" || Number.isNaN(stonePrice))) {
      return NextResponse.json(
        { error: "stonePrice must be a valid number" },
        { status: 400 }
      );
    }

    if (
      taxPercent !== null &&
      taxPercent !== undefined &&
      (typeof taxPercent !== "number" || Number.isNaN(taxPercent))
    ) {
      return NextResponse.json(
        { error: "taxPercent must be a valid number if provided" },
        { status: 400 }
      );
    }

    const finalPrice = await calculateFinalPrice({
      metalId,
      subCategoryId: subCategoryId || null,
      weight,
      stonePrice: stonePrice ?? 0,
      taxIncluded: Boolean(taxIncluded),
      taxPercent,
    });

    let finalImageUrl: string | undefined = imageUrl;

    if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      try {
        finalImageUrl = await uploadImageToCloudinary(imageUrl, {
          folder: "reverdale/jewellery",
          publicIdPrefix: "jewellery",
        });
      } catch (uploadError) {
        console.error("Error uploading jewellery image to Cloudinary", uploadError);
        return NextResponse.json(
          { error: "Failed to upload jewellery image" },
          { status: 500 }
        );
      }
    }

    const jewellery = await Jewellery.create({
      name,
      sku: typeof sku === "string" ? sku.trim() : "",
      metalId,
      categoryId,
      subCategoryId: subCategoryId || null,
      stonePrice: stonePrice ?? 0,
      weight,
      purity,
      unit,
      description,
      imageUrl: finalImageUrl,
      inStock:
        typeof stockQuantity === "number"
          ? stockQuantity > 0
          : Boolean(inStock),
      stockQuantity:
        typeof stockQuantity === "number" && Number.isFinite(stockQuantity)
          ? Math.max(0, Math.floor(stockQuantity))
          : inStock
          ? 1
          : 0,
      taxIncluded,
      taxPercent,
      finalPrice,
    });
    
    await jewellery.populate({ path: "metalId", select: "name basePrice" });
    await jewellery.populate({ path: "categoryId", select: "name" });
    await jewellery.populate({ path: "subCategoryId", select: "name makePrice" });
    const created = jewellery;

    return NextResponse.json(
      {
        id: created._id.toString(),
        name: created.name,
        sku: created.sku ?? "",
        metalId: created.metalId?._id?.toString() ?? created.metalId?.toString() ?? null,
        metalName: (created as any).metalId?.name ?? null,
        metalBasePrice: (created as any).metalId?.basePrice ?? null,
        categoryId:
          created.categoryId?._id?.toString() ?? created.categoryId?.toString() ?? null,
        categoryName: (created as any).categoryId?.name ?? null,
        subCategoryId:
          created.subCategoryId?._id?.toString() ??
          created.subCategoryId?.toString() ??
          null,
        subCategoryName: (created as any).subCategoryId?.name ?? null,
        subCategoryMakePrice: (created as any).subCategoryId?.makePrice ?? null,
        stonePrice: created.stonePrice,
        weight: created.weight,
        purity: created.purity,
        unit: created.unit,
        description: created.description,
        imageUrl: created.imageUrl,
        inStock: created.inStock,
        stockQuantity:
          typeof (created as any).stockQuantity === "number"
            ? (created as any).stockQuantity
            : created.inStock
            ? 1
            : 0,
        taxIncluded: created.taxIncluded,
        taxPercent: created.taxPercent,
        finalPrice: created.finalPrice,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating jewellery", error);

    return NextResponse.json(
      { error: "Failed to create jewellery" },
      { status: 500 }
    );
  }
}

