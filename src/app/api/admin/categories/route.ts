import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "../../../../../lib/models/Category";

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find()
      .populate("parentId", "name")
      .lean();

    const result = categories.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      description: cat.description,
      imageUrl: cat.imageUrl,
      type: cat.type,
      parentId: cat.parentId?._id?.toString() ?? null,
      parentName: cat.parentId?.name ?? null,
      makePrice: cat.makePrice,
      status: cat.status,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories", error);
    return NextResponse.json(
      { error: "Failed to load categories" },
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
      description,
      imageUrl,
      type,
      parentId,
      makePrice,
      status,
    } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: "name and type are required" },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      description,
      imageUrl,
      type,
      parentId: parentId || null,
      makePrice,
      status,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category", error);

    if (error?.code === 11000) {
      const duplicateField = Object.keys(error?.keyPattern ?? {})[0] ?? "field";
      return NextResponse.json(
        { error: `Duplicate value for ${duplicateField}. Please use a different value.` },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

