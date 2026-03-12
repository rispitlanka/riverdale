import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SellRequest from "@/lib/models/Request";

function generateReferenceNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `REQ-${y}${m}${d}-${random}`;
}

/**
 * GET ?reference=REQ-... – public: fetch one sell request by reference (for track page).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference?.trim()) {
      return NextResponse.json(
        { error: "Reference number is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const doc = await SellRequest.findOne({
      referenceNumber: reference.trim(),
    })
      .populate("category", "name")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    const docWithPopulated = doc as typeof doc & { category?: { name: string } | null };
    const categoryName =
      docWithPopulated.category && typeof docWithPopulated.category === "object" && "name" in docWithPopulated.category
        ? docWithPopulated.category.name
        : undefined;

    const result = {
      ...doc,
      _id: doc._id?.toString(),
      categoryName,
      category: undefined,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Error fetching request", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

/**
 * POST – public: create a new sell request (form submit).
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();

    const {
      customerName,
      email,
      phone,
      address,
      metalType,
      category,
      approximateWeight,
      purity,
      description,
      preferredPrice,
      metalPhotos,
      purchaseInvoice,
      idProof,
      pickupPreference,
      preferredDate,
      preferredTime,
      location,
      appointmentId,
    } = body;

    if (
      !customerName ||
      !email ||
      !phone ||
      !address ||
      !metalType ||
      approximateWeight == null ||
      !purity ||
      !pickupPreference ||
      !location
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: customerName, email, phone, address, metalType, approximateWeight, purity, pickupPreference, location",
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(metalPhotos) || metalPhotos.length === 0) {
      return NextResponse.json(
        { error: "At least one metal photo is required" },
        { status: 400 }
      );
    }

    const referenceNumber = generateReferenceNumber();

    const doc = await SellRequest.create({
      referenceNumber,
      customerName: String(customerName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      metalType: String(metalType).trim(),
      category: category || undefined,
      approximateWeight: Number(approximateWeight),
      purity: String(purity).trim(),
      description: description ? String(description).trim() : "",
      preferredPrice:
        preferredPrice != null && preferredPrice !== ""
          ? Number(preferredPrice)
          : undefined,
      metalPhotos: Array.isArray(metalPhotos) ? metalPhotos : [],
      purchaseInvoice: purchaseInvoice || undefined,
      idProof: idProof || undefined,
      pickupPreference: String(pickupPreference),
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
      preferredTime: preferredTime || undefined,
      location: String(location).trim(),
      appointmentId: appointmentId || undefined,
      status: "submitted",
    });

    const created = doc.toObject();
    return NextResponse.json(
      {
        _id: created._id?.toString(),
        referenceNumber: created.referenceNumber,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating sell request", error);
    return NextResponse.json(
      { error: "Failed to create request" },
      { status: 500 }
    );
  }
}
