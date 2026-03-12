import mongoose, { Schema, Model, Document } from 'mongoose';

export interface TagDocument extends Document {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const TagSchema = new Schema<TagDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
TagSchema.index({ slug: 1 });
TagSchema.index({ isActive: 1 });

type TagModel = Model<TagDocument>;

const Tag: TagModel =
  (mongoose.models.Tag as TagModel) ||
  mongoose.model<TagDocument>('Tag', TagSchema);

export default Tag;
