import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Jewellery from "../../../../../../lib/models/Jewellery";
import Metal from "../../../../../../lib/models/Metal";
import Category from "../../../../../../lib/models/Category";
import { uploadImageToCloudinary } from "../../../../../../lib/cloudinary";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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

  let finalPrice = (metalBasePrice + makePrice) * numericWeight + numericStonePrice;

  const numericTaxPercent =
    typeof taxPercent === "number" && !Number.isNaN(taxPercent) ? taxPercent : 0;

  if (taxIncluded && numericTaxPercent > 0) {
    finalPrice = finalPrice * (1 + numericTaxPercent / 100);
  }

  return finalPrice;
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();

    const existing = await Jewellery.findById(id);

    if (!existing) {
      return NextResponse.json({ error: "Jewellery not found" }, { status: 404 });
    }

    const metalId = updates.metalId || existing.metalId.toString();
    const subCategoryId =
      updates.subCategoryId !== undefined
        ? updates.subCategoryId
        : existing.subCategoryId?.toString() ?? null;

    const weight =
      updates.weight !== undefined ? updates.weight : existing.weight;
    const stonePrice =
      updates.stonePrice !== undefined ? updates.stonePrice : existing.stonePrice;
    const taxIncluded =
      updates.taxIncluded !== undefined ? updates.taxIncluded : existing.taxIncluded;
    const taxPercent =
      updates.taxPercent !== undefined ? updates.taxPercent : existing.taxPercent;

    if (typeof weight !== "number" || Number.isNaN(weight)) {
      return NextResponse.json(
        { error: "weight must be a valid number" },
        { status: 400 }
      );
    }

    if (
      stonePrice !== undefined &&
      (typeof stonePrice !== "number" || Number.isNaN(stonePrice))
    ) {
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
      subCategoryId,
      weight,
      stonePrice: stonePrice ?? 0,
      taxIncluded: Boolean(taxIncluded),
      taxPercent,
    });

    let imageUrl = updates.imageUrl ?? existing.imageUrl;

    if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      try {
        imageUrl = await uploadImageToCloudinary(imageUrl, {
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

    const updated = await Jewellery.findByIdAndUpdate(
      id,
      {
        ...updates,
        metalId,
        subCategoryId,
        stonePrice,
        taxIncluded,
        taxPercent,
        imageUrl,
        finalPrice,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("metalId", "name basePrice")
      .populate("categoryId", "name")
      .populate("subCategoryId", "name makePrice");

    if (!updated) {
      return NextResponse.json({ error: "Jewellery not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: updated._id.toString(),
        name: updated.name,
        metalId: updated.metalId?._id?.toString() ?? updated.metalId?.toString() ?? null,
        metalName: (updated as any).metalId?.name ?? null,
        metalBasePrice: (updated as any).metalId?.basePrice ?? null,
        categoryId:
          updated.categoryId?._id?.toString() ?? updated.categoryId?.toString() ?? null,
        categoryName: (updated as any).categoryId?.name ?? null,
        subCategoryId:
          updated.subCategoryId?._id?.toString() ??
          updated.subCategoryId?.toString() ??
          null,
        subCategoryName: (updated as any).subCategoryId?.name ?? null,
        subCategoryMakePrice: (updated as any).subCategoryId?.makePrice ?? null,
        stonePrice: updated.stonePrice,
        weight: updated.weight,
        purity: updated.purity,
        unit: updated.unit,
        description: updated.description,
        imageUrl: updated.imageUrl,
        inStock: updated.inStock,
        taxIncluded: updated.taxIncluded,
        taxPercent: updated.taxPercent,
        finalPrice: updated.finalPrice,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating jewellery", error);
    return NextResponse.json(
      { error: "Failed to update jewellery" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    const deleted = await Jewellery.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Jewellery not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting jewellery", error);
    return NextResponse.json(
      { error: "Failed to delete jewellery" },
      { status: 500 }
    );
  }
}

