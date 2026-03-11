import { Schema, model, models, Document } from 'mongoose';

export type BannerSlot = 'header' | 'middle1' | 'middle2';

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
      enum: ['header', 'middle1', 'middle2'],
      required: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Banner =
  (models.Banner as ReturnType<typeof model<BannerDocument>>) ||
  model<BannerDocument>('Banner', BannerSchema);

export default Banner;

