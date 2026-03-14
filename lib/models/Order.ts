import mongoose, { Schema, Model, Document, Types } from "mongoose";

export type OrderItemType = "jewellery" | "product" | "sell-metal";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "new"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  itemId: Types.ObjectId;
  itemType: OrderItemType;
  name: string;
  metalType?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  changedBy: string;
}

export interface OrderDocument extends Document {
  orderRef: string;
  customerId: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  } | null;
  items: OrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
  stripeSessionId?: string | null;
  orderStatus: OrderStatus;
  statusHistory: StatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<OrderItem>(
  {
    itemId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    itemType: {
      type: String,
      enum: ["jewellery", "product", "sell-metal"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    metalType: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema<StatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: ["new", "processing", "shipped", "delivered", "cancelled"],
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    changedBy: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema<OrderDocument>(
  {
    orderRef: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    shippingAddress: {
      street: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      zipCode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      default: [],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    stripeSessionId: {
      type: String,
      trim: true,
      default: null,
    },
    orderStatus: {
      type: String,
      enum: ["new", "processing", "shipped", "delivered", "cancelled"],
      default: "new",
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

type OrderModel = Model<OrderDocument>;

// In dev, Next.js HMR can keep an old compiled model around.
// If the schema changes (e.g. adding `shippingAddress`), Mongoose will otherwise
// reuse the old model and drop new fields on writes.
if (process.env.NODE_ENV === "development" && mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order =
  (mongoose.models.Order as OrderModel) ||
  mongoose.model<OrderDocument>("Order", OrderSchema);

export default Order;