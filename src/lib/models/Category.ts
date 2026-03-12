import mongoose, { Schema, Model, Document } from 'mongoose';

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const CategorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
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

// Index for faster queries
CategorySchema.index({ slug: 1 });
CategorySchema.index({ isActive: 1 });

type CategoryModel = Model<CategoryDocument>;

const Category: CategoryModel =
  (mongoose.models.Category as CategoryModel) ||
  mongoose.model<CategoryDocument>('Category', CategorySchema);

export default Category;


