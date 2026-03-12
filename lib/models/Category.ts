import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type CategoryType = 'parent' | 'sub';
export type CategoryStatus = 'active' | 'inactive';

export interface CategoryDocument extends Document {
  name: string;
  description?: string;
  imageUrl?: string;
  type: CategoryType;
  parentId?: Types.ObjectId | null;
  makePrice?: number | null;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
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
    type: {
      type: String,
      enum: ['parent', 'sub'],
      required: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    makePrice: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

type CategoryModel = Model<CategoryDocument>;

const Category =
  (mongoose.models.Category as CategoryModel) ||
  mongoose.model<CategoryDocument>('Category', CategorySchema);

export default Category;

