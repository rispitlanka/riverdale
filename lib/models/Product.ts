import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface ProductDocument extends Document {
  name: string;
  metalId: Types.ObjectId;
  categoryId: Types.ObjectId;
  subCategoryId?: Types.ObjectId;
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

const ProductSchema = new Schema<ProductDocument>(
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

type ProductModel = Model<ProductDocument>;

const Product =
  (mongoose.models.Product as ProductModel) ||
  mongoose.model<ProductDocument>('Product', ProductSchema);

export default Product;

