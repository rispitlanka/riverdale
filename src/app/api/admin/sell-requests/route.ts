import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SellRequest from "@/lib/models/Request";

/**
 * GET – list all sell requests (newest first) for admin dashboard.
 */
export async function GET() {
  try {
    await connectDB();

    const list = await SellRequest.find()
      .sort({ submittedAt: -1 })
      .populate("category", "name")
      .lean();

    const items = list.map((doc: any) => {
      const categoryName =
        doc.category && typeof doc.category === "object" && "name" in doc.category
          ? (doc.category as { name: string }).name
          : undefined;
      return {
        _id: doc._id?.toString(),
        referenceNumber: doc.referenceNumber,
        customerName: doc.customerName,
        email: doc.email,
        phone: doc.phone,
        metalType: doc.metalType,
        categoryName,
        approximateWeight: doc.approximateWeight,
        purity: doc.purity,
        status: doc.status,
        submittedAt: doc.submittedAt,
        preferredDate: doc.preferredDate,
        preferredTime: doc.preferredTime,
        location: doc.location,
        pickupPreference: doc.pickupPreference,
      };
    });

    return NextResponse.json(items, { status: 200 });
  } catch (error) {
    console.error("Error listing sell requests", error);
    return NextResponse.json(
      { error: "Failed to load sell requests" },
      { status: 500 }
    );
  }
}
