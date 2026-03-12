import mongoose, { Schema, Model, Document } from "mongoose";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface AppointmentDocument extends Document {
  customerName: string;
  phone: string;
  date: Date;
  purpose: string;
  status: AppointmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  {
    timestamps: true,
  }
);

type AppointmentModel = Model<AppointmentDocument>;

const Appointment =
  (mongoose.models.Appointment as AppointmentModel) ||
  mongoose.model<AppointmentDocument>("Appointment", AppointmentSchema);

export default Appointment;

