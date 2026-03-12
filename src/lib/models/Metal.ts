import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface MetalDocument extends Document {
  name: string;
  category: Types.ObjectId;
  tags?: Types.ObjectId[];
  weight: number;
  weightUnit: string;
  pricePerGram: number;
  purity: string;
  sku: string;
  description?: string;
  images?: string[];
  stockStatus: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const MetalSchema = new Schema<MetalDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: 'Tag',
    }],
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    weightUnit: {
      type: String,
      default: 'grams',
      enum: ['grams', 'ounces', 'kg'],
    },
    pricePerGram: {
      type: Number,
      required: true,
      min: 0,
    },
    purity: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    stockStatus: {
      type: String,
      enum: ['in-stock', 'out-of-stock'],
      default: 'in-stock',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
MetalSchema.index({ category: 1, isActive: 1 });
MetalSchema.index({ sku: 1 });
MetalSchema.index({ pricePerGram: 1 });

type MetalModel = Model<MetalDocument>;

const Metal: MetalModel =
  (mongoose.models.Metal as MetalModel) ||
  mongoose.model<MetalDocument>('Metal', MetalSchema);

export default Metal;


