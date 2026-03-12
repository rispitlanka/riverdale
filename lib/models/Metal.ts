import mongoose, { Schema, Model, Document } from 'mongoose';

export interface MetalDocument extends Document {
  name: string;
  basePrice: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MetalSchema = new Schema<MetalDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

type MetalModel = Model<MetalDocument>;

const Metal =
  (mongoose.models.Metal as MetalModel) ||
  mongoose.model<MetalDocument>('Metal', MetalSchema);

export default Metal;

