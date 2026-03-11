import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "../../../../../../lib/models/Product";
import Metal from "../../../../../../lib/models/Metal";
import Category from "../../../../../../lib/models/Category";
import { calculateProductPrice } from "../../../../../../lib/priceUtils";
import { uploadImageToCloudinary } from "../../../../../../lib/cloudinary";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = params;
    const updates = await request.json();

    const existing = await Product.findById(id);

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const metalId = updates.metalId || existing.metalId.toString();
    const subCategoryId =
      updates.subCategoryId !== undefined
        ? updates.subCategoryId
        : existing.subCategoryId?.toString() ?? null;

    const weight =
      updates.weight !== undefined ? updates.weight : existing.weight;

    if (typeof weight !== "number" || Number.isNaN(weight)) {
      return NextResponse.json(
        { error: "weight must be a valid number" },
        { status: 400 }
      );
    }

    const metal = await Metal.findById(metalId).lean();
    if (!metal) {
      return NextResponse.json({ error: "Invalid metalId" }, { status: 400 });
    }

    let makePrice = 0;

    if (subCategoryId) {
      const subCategory = await Category.findById(subCategoryId).lean();
      if (!subCategory) {
        return NextResponse.json(
          { error: "Invalid subCategoryId" },
          { status: 400 }
        );
      }
      makePrice =
        typeof subCategory.makePrice === "number" &&
        !Number.isNaN(subCategory.makePrice)
          ? subCategory.makePrice
          : 0;
    }

    const finalPrice = calculateProductPrice(
      metal.basePrice as number,
      makePrice,
      weight
    );

    let imageUrl = updates.imageUrl ?? existing.imageUrl;

    if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      try {
        imageUrl = await uploadImageToCloudinary(imageUrl, {
          folder: "reverdale/products",
          publicIdPrefix: "product",
        });
      } catch (uploadError) {
        console.error("Error uploading product image to Cloudinary", uploadError);
        return NextResponse.json(
          { error: "Failed to upload product image" },
          { status: 500 }
        );
      }
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      {
        ...updates,
        metalId,
        subCategoryId,
        weight,
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
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: updated._id.toString(),
        name: updated.name,
        metalId:
          (updated as any).metalId?._id?.toString() ??
          (updated as any).metalId?.toString() ??
          null,
        metalName: (updated as any).metalId?.name ?? null,
        metalBasePrice: (updated as any).metalId?.basePrice ?? null,
        categoryId:
          (updated as any).categoryId?._id?.toString() ??
          (updated as any).categoryId?.toString() ??
          null,
        categoryName: (updated as any).categoryId?.name ?? null,
        subCategoryId:
          (updated as any).subCategoryId?._id?.toString() ??
          (updated as any).subCategoryId?.toString() ??
          null,
        subCategoryName: (updated as any).subCategoryId?.name ?? null,
        subCategoryMakePrice: (updated as any).subCategoryId?.makePrice ?? null,
        weight: updated.weight,
        purity: updated.purity,
        unit: updated.unit,
        description: updated.description,
        imageUrl: updated.imageUrl,
        inStock: updated.inStock,
        finalPrice: updated.finalPrice,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating product", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = params;

    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting product", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

