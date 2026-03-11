import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Product from "../../../../../lib/models/Product";
import Metal from "../../../../../lib/models/Metal";
import Category from "../../../../../lib/models/Category";
import { calculateProductPrice } from "../../../../../lib/priceUtils";
import { uploadImageToCloudinary } from "../../../../../lib/cloudinary";

export async function GET() {
  try {
    await connectDB();

    const items = await Product.find()
      .populate("metalId", "name basePrice")
      .populate("categoryId", "name")
      .populate("subCategoryId", "name makePrice")
      .lean();

    const result = items.map((item: any) => ({
      id: item._id.toString(),
      name: item.name,
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
      weight: item.weight,
      purity: item.purity,
      unit: item.unit,
      description: item.description,
      imageUrl: item.imageUrl,
      inStock: item.inStock,
      finalPrice: item.finalPrice,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching products", error);
    return NextResponse.json(
      { error: "Failed to load products" },
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
      metalId,
      categoryId,
      subCategoryId,
      weight,
      purity,
      unit,
      description,
      imageUrl,
      inStock = true,
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

    let finalImageUrl: string | undefined = imageUrl;

    if (typeof imageUrl === "string" && imageUrl.startsWith("data:")) {
      try {
        finalImageUrl = await uploadImageToCloudinary(imageUrl, {
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

    const product = await Product.create({
      name,
      metalId,
      categoryId,
      subCategoryId: subCategoryId || null,
      weight,
      purity,
      unit,
      description,
      imageUrl: finalImageUrl,
      inStock,
      finalPrice,
    });

    await product.populate("metalId", "name basePrice");
    await product.populate("categoryId", "name");
    await product.populate("subCategoryId", "name makePrice");

    const created = product;

    return NextResponse.json(
      {
        id: created._id.toString(),
        name: created.name,
        metalId:
          (created as any).metalId?._id?.toString() ??
          (created as any).metalId?.toString() ??
          null,
        metalName: (created as any).metalId?.name ?? null,
        metalBasePrice: (created as any).metalId?.basePrice ?? null,
        categoryId: created.categoryId?._id?.toString() ?? created.categoryId?.toString() ?? null,
        categoryName: (created as any).categoryId?.name ?? null,
        subCategoryId:
          (created as any).subCategoryId?._id?.toString() ??
          (created as any).subCategoryId?.toString() ??
          null,
        subCategoryName: (created as any).subCategoryId?.name ?? null,
        subCategoryMakePrice: (created as any).subCategoryId?.makePrice ?? null,
        weight: created.weight,
        purity: created.purity,
        unit: created.unit,
        description: created.description,
        imageUrl: created.imageUrl,
        inStock: created.inStock,
        finalPrice: created.finalPrice,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating product", error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

