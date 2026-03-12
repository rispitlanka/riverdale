import { NextRequest, NextResponse } from "next/server";
import { uploadImageToCloudinary } from "../../../../lib/cloudinary";

/**
 * Public upload endpoint for sell form and other client uploads.
 * Accepts multipart file, uploads to Cloudinary (reverdale/sell), returns { url }.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imageUrl = await uploadImageToCloudinary(buffer, {
      folder: "reverdale/sell",
      publicIdPrefix: "sell",
    });

    return NextResponse.json({ url: imageUrl }, { status: 200 });
  } catch (error) {
    console.error("Upload error", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
