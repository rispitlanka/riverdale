import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
  metal: mongoose.Types.ObjectId | string;
  metalName: string;
  metalSku: string;
  quantity: number;
  pricePerGram: number;
  weight: number;
  weightUnit: string;
  totalPrice: number;
  metalImage?: string;
}

export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'stripe';
  stripePaymentIntentId?: string;
  stripeSessionId?: string;
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'USA' },
    },
    items: [
      {
        metal: {
          type: Schema.Types.ObjectId,
          ref: 'Metal',
          required: true,
        },
        metalName: { type: String, required: true },
        metalSku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        pricePerGram: { type: Number, required: true },
        weight: { type: Number, required: true },
        weightUnit: { type: String, required: true },
        totalPrice: { type: Number, required: true },
        metalImage: { type: String },
      },
    ],
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      default: 0,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe'],
      default: 'stripe',
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeSessionId: {
      type: String,
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
    },
    notes: {
      type: String,
    },
    paidAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before validation
OrderSchema.pre('validate', async function () {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(5, '0')}`;
  }
});

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

