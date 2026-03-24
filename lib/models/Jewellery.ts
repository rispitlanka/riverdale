import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface JewelleryDocument extends Document {
  name: string;
  sku?: string;
  metalId: Types.ObjectId;
  categoryId: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
  stonePrice: number;
  weight: number;
  purity: string;
  unit: string;
  description?: string;
  imageUrl?: string;
  inStock: boolean;
  stockQuantity: number;
  taxIncluded: boolean;
  taxPercent?: number | null;
  finalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const JewellerySchema = new Schema<JewelleryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    metalId: {
      type: Schema.Types.ObjectId,
      ref: 'Metal',
      required: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    stonePrice: {
      type: Number,
      default: 0,
    },
    weight: {
      type: Number,
      required: true,
    },
    purity: {
      type: String,
      required: true,
      trim: true,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    stockQuantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    taxIncluded: {
      type: Boolean,
      default: true,
    },
    taxPercent: {
      type: Number,
      default: null,
    },
    finalPrice: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

type JewelleryModel = Model<JewelleryDocument>;

// In dev, Next.js HMR can keep an old compiled model around.
// If the schema changes, Mongoose may reuse stale schema fields.
if (process.env.NODE_ENV === "development" && mongoose.models.Jewellery) {
  delete mongoose.models.Jewellery;
}

const Jewellery =
  (mongoose.models.Jewellery as JewelleryModel) ||
  mongoose.model<JewelleryDocument>('Jewellery', JewellerySchema);

export default Jewellery;

