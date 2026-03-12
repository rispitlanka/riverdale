import mongoose from 'mongoose';

export interface IAppointment extends mongoose.Document {
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // Appointment Details
  appointmentDate: Date; // Date of appointment
  startTime: string; // Start time (HH:mm format)
  endTime: string; // End time (HH:mm format)
  duration: number; // Duration in minutes
  
  // Status
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  
  // Link to Sell Request
  sellRequestId?: mongoose.Types.ObjectId;
  
  // Admin Notes
  adminNotes?: string;
  
  // Cancellation Info
  cancelledAt?: Date;
  cancelledBy?: string;
  cancellationReason?: string;
  
  // Reminder Sent
  reminderSent?: boolean;
  reminderSentAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new mongoose.Schema<IAppointment>(
  {
    // Customer Information
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Appointment Details
    appointmentDate: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    
    // Status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    
    // Link to Sell Request
    sellRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SellRequest',
    },
    
    // Admin Notes
    adminNotes: {
      type: String,
      default: '',
    },
    
    // Cancellation Info
    cancelledAt: Date,
    cancelledBy: String,
    cancellationReason: String,
    
    // Reminder Sent
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
  },
  { 
    timestamps: true,
  }
);

    // Add indexes for better query performance
AppointmentSchema.index({ appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ customerEmail: 1 });
AppointmentSchema.index({ status: 1 });

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model<IAppointment>('Appointment', AppointmentSchema);

export default Appointment;

