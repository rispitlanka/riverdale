import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface TodayPriceDocument extends Document {
  metalId: Types.ObjectId;
  price: number;
  showOnSite: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TodayPriceSchema = new Schema<TodayPriceDocument>(
  {
    metalId: {
      type: Schema.Types.ObjectId,
      ref: 'Metal',
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    showOnSite: {
      type: Boolean,
      default: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

type TodayPriceModel = Model<TodayPriceDocument>;

const TodayPrice =
  (mongoose.models.TodayPrice as TodayPriceModel) ||
  mongoose.model<TodayPriceDocument>('TodayPrice', TodayPriceSchema);

export default TodayPrice;

