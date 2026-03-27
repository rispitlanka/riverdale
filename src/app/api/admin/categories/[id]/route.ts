import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import Category from "../../../../../../lib/models/Category";
import Jewellery from "../../../../../../lib/models/Jewellery";
import Product from "../../../../../../lib/models/Product";
import {
  calculateJewelleryPrice,
  calculateProductPrice,
} from "../../../../../../lib/priceUtils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();

    const existing = await Category.findById(id).lean();
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const updated = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    const oldMakePrice =
      typeof existing.makePrice === "number" && !Number.isNaN(existing.makePrice)
        ? existing.makePrice
        : 0;
    const newMakePrice =
      typeof updated.makePrice === "number" && !Number.isNaN(updated.makePrice)
        ? updated.makePrice
        : 0;

    let jewelleryUpdated = 0;
    let productsUpdated = 0;

    if (oldMakePrice !== newMakePrice) {
      const affectedCategoryIds: Types.ObjectId[] = [updated._id as Types.ObjectId];

      if (updated.type === "parent") {
        const subCategories = await Category.find({ parentId: updated._id })
          .select("_id")
          .lean();
        for (const sub of subCategories) {
          affectedCategoryIds.push(sub._id as Types.ObjectId);
        }
      }

      const uniqueCategoryIds = Array.from(
        new Map(
          affectedCategoryIds.map((catId) => [catId.toString(), catId])
        ).values()
      );

      type BulkUpdateOp = {
        updateOne: {
          filter: { _id: Types.ObjectId };
          update: { $set: { finalPrice: number } };
        };
      };

      const jewelleryItems = await Jewellery.find({
        $or: [
          { categoryId: { $in: uniqueCategoryIds } },
          { subCategoryId: { $in: uniqueCategoryIds } },
        ],
      })
        .populate("metalId", "basePrice")
        .populate("categoryId", "makePrice")
        .populate("subCategoryId", "makePrice")
        .lean();

      const jewelleryBulkOps: BulkUpdateOp[] = [];
      for (const item of jewelleryItems as any[]) {
        const metalBasePrice =
          typeof item?.metalId?.basePrice === "number" &&
          !Number.isNaN(item.metalId.basePrice)
            ? item.metalId.basePrice
            : 0;

        const makePrice =
          typeof item?.subCategoryId?.makePrice === "number" &&
          !Number.isNaN(item.subCategoryId.makePrice)
            ? item.subCategoryId.makePrice
            : typeof item?.categoryId?.makePrice === "number" &&
                !Number.isNaN(item.categoryId.makePrice)
              ? item.categoryId.makePrice
              : 0;

        const nextFinalPrice = calculateJewelleryPrice(
          metalBasePrice,
          makePrice,
          item.weight ?? 0,
          item.stonePrice ?? 0,
          false,
          null
        );

        jewelleryBulkOps.push({
          updateOne: {
            filter: { _id: item._id as Types.ObjectId },
            update: { $set: { finalPrice: nextFinalPrice } },
          },
        });
      }

      if (jewelleryBulkOps.length > 0) {
        const result = await Jewellery.collection.bulkWrite(
          jewelleryBulkOps as Parameters<typeof Jewellery.collection.bulkWrite>[0],
          { ordered: false }
        );
        jewelleryUpdated = result.modifiedCount ?? 0;
      }

      const productItems = await Product.find({
        $or: [
          { categoryId: { $in: uniqueCategoryIds } },
          { subCategoryId: { $in: uniqueCategoryIds } },
        ],
      })
        .populate("metalId", "basePrice")
        .populate("categoryId", "makePrice")
        .populate("subCategoryId", "makePrice")
        .lean();

      const productBulkOps: BulkUpdateOp[] = [];
      for (const item of productItems as any[]) {
        const metalBasePrice =
          typeof item?.metalId?.basePrice === "number" &&
          !Number.isNaN(item.metalId.basePrice)
            ? item.metalId.basePrice
            : 0;

        const makePrice =
          typeof item?.subCategoryId?.makePrice === "number" &&
          !Number.isNaN(item.subCategoryId.makePrice)
            ? item.subCategoryId.makePrice
            : typeof item?.categoryId?.makePrice === "number" &&
                !Number.isNaN(item.categoryId.makePrice)
              ? item.categoryId.makePrice
              : 0;

        const nextFinalPrice = calculateProductPrice(
          metalBasePrice,
          makePrice,
          item.weight ?? 0
        );

        productBulkOps.push({
          updateOne: {
            filter: { _id: item._id as Types.ObjectId },
            update: { $set: { finalPrice: nextFinalPrice } },
          },
        });
      }

      if (productBulkOps.length > 0) {
        const result = await Product.collection.bulkWrite(
          productBulkOps as Parameters<typeof Product.collection.bulkWrite>[0],
          { ordered: false }
        );
        productsUpdated = result.modifiedCount ?? 0;
      }
    }

    return NextResponse.json(
      {
        category: updated,
        makePriceChanged: oldMakePrice !== newMakePrice,
        jewelleryUpdated,
        productsUpdated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating category", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;

    const category = await Category.findById(id);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    if (category.type === "parent") {
      const hasSubCategories = await Category.exists({ parentId: category._id });
      if (hasSubCategories) {
        return NextResponse.json(
          {
            error:
              "Cannot delete parent category while sub-categories are linked to it.",
          },
          { status: 400 }
        );
      }
    }

    const hasLinkedJewellery = await Jewellery.exists({
      $or: [{ categoryId: category._id }, { subCategoryId: category._id }],
    });

    if (hasLinkedJewellery) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category that has jewellery items linked to it.",
        },
        { status: 400 }
      );
    }

    await Category.findByIdAndDelete(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

