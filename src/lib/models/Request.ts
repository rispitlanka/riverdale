import mongoose, { Schema, Model, Document, Types } from 'mongoose';

export interface ISellRequestDocument extends Document {
  referenceNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  metalType: string;
  category?: Types.ObjectId;
  approximateWeight: number;
  purity: string;
  description: string;
  preferredPrice?: number;
  metalPhotos: string[];
  purchaseInvoice?: string;
  idProof?: {
    type: string;
    documents: string[];
  };
  pickupPreference: string;
  preferredDate?: Date;
  preferredTime?: string;
  location: string;
  appointmentId?: Types.ObjectId;
  status: string;
  adminNotes?: string;
  quotedPrice?: number;
  submittedAt: Date;
  reviewedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SellRequestSchema = new Schema<ISellRequestDocument>(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    metalType: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    approximateWeight: { type: Number, required: true, min: 0 },
    purity: { type: String, required: true },
    description: { type: String, default: '' },
    preferredPrice: { type: Number, min: 0 },
    metalPhotos: { type: [String], default: [] },
    purchaseInvoice: { type: String },
    idProof: {
      type: {
        type: String,
        enum: ['passport', 'nic', 'license'],
      },
      documents: { type: [String], default: [] },
    },
    pickupPreference: {
      type: String,
      enum: ['home-pickup', 'drop-at-store'],
      required: true,
    },
    preferredDate: { type: Date },
    preferredTime: { type: String },
    location: { type: String, required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'quoted', 'confirmed', 'in_process', 'completed', 'rejected'],
      default: 'submitted',
    },
    adminNotes: { type: String, default: '' },
    quotedPrice: { type: Number, min: 0 },
    submittedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

SellRequestSchema.index({ referenceNumber: 1 });
SellRequestSchema.index({ status: 1 });
SellRequestSchema.index({ email: 1 });
SellRequestSchema.index({ submittedAt: -1 });

type SellRequestModel = Model<ISellRequestDocument>;

const SellRequest: SellRequestModel =
  (mongoose.models.SellRequest as SellRequestModel) ||
  mongoose.model<ISellRequestDocument>('SellRequest', SellRequestSchema);

export default SellRequest;
