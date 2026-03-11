import { v2 as cloudinary } from "cloudinary";

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  throw new Error(
    "Cloudinary environment variables are not set. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET."
  );
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImageToCloudinary(
  data: string | Buffer,
  options: { folder?: string; publicIdPrefix?: string } = {}
): Promise<string> {
  const { folder, publicIdPrefix } = options;

  const uploadOptions: any = {
    folder,
    resource_type: "image",
  };

  if (publicIdPrefix) {
    uploadOptions.public_id = `${publicIdPrefix}-${Date.now()}`;
  }

  const fileData =
    typeof data === "string"
      ? data
      : `data:image/jpeg;base64,${data.toString("base64")}`;

  const result = await cloudinary.uploader.upload(fileData, uploadOptions);
  return result.secure_url;
}

