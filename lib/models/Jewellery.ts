import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface JewelleryDocument extends Document {
  name: string;
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

const Jewellery =
  (mongoose.models.Jewellery as JewelleryModel) ||
  mongoose.model<JewelleryDocument>('Jewellery', JewellerySchema);

export default Jewellery;

