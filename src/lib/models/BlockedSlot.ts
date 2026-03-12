import mongoose from 'mongoose';

export interface IBlockedSlot extends mongoose.Document {
  date: Date;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  reason?: string;
  blockedBy: string; // Admin email/name
  createdAt: Date;
  updatedAt: Date;
}

const BlockedSlotSchema = new mongoose.Schema<IBlockedSlot>(
  {
    date: {
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
    reason: {
      type: String,
      default: '',
    },
    blockedBy: {
      type: String,
      required: true,
    },
  },
  { 
    timestamps: true,
  }
);

// Add index for better query performance
BlockedSlotSchema.index({ date: 1, startTime: 1 });

const BlockedSlot =
  mongoose.models.BlockedSlot ||
  mongoose.model<IBlockedSlot>('BlockedSlot', BlockedSlotSchema);

export default BlockedSlot;

