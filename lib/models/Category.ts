import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export type CategoryType = 'parent' | 'sub';
export type CategoryStatus = 'active' | 'inactive';

export interface CategoryDocument extends Document {
  name: string;
  slug?: string;
  description?: string;
  imageUrl?: string;
  type: CategoryType;
  parentId?: Types.ObjectId | null;
  makePrice?: number | null;
  status: CategoryStatus;
  isActive?: boolean;
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
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: undefined,
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
    // Back-compat for older pages (e.g. rates) that query `isActive`
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for older flows + admin filtering
CategorySchema.index({ slug: 1 }, { unique: true, sparse: true });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ type: 1, status: 1 });

type CategoryModel = Model<CategoryDocument>;

// In dev, Next.js HMR can keep an old compiled model around.
// If the schema changes (e.g. adding `parentId`), Mongoose will otherwise
// reuse the old model and strictPopulate may fail.
if (process.env.NODE_ENV === "development" && mongoose.models.Category) {
  delete mongoose.models.Category;
}

const Category =
  (mongoose.models.Category as CategoryModel) ||
  mongoose.model<CategoryDocument>('Category', CategorySchema);

export default Category;

