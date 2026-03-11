import mongoose, { Schema, Model, Document } from "mongoose";

export type BannerSlot = "header" | "middle1" | "middle2";

export interface BannerDocument extends Document {
  slot: BannerSlot;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<BannerDocument>(
  {
    slot: {
      type: String,
      enum: ["header", "middle1", "middle2"],
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: false,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

type BannerModel = Model<BannerDocument>;

const Banner =
  (mongoose.models.Banner as BannerModel) ||
  mongoose.model<BannerDocument>("Banner", BannerSchema);

export default Banner;

