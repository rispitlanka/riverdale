import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "../../../../../../lib/models/Category";
import Jewellery from "../../../../../../lib/models/Jewellery";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    await connectDB();
    const { id } = await params;
    const updates = await request.json();

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

    return NextResponse.json(updated, { status: 200 });
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

