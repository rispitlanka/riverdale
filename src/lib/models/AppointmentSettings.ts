import mongoose from 'mongoose';

const DayScheduleSchema = new mongoose.Schema({
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    required: true,
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  openTime: {
    type: String, // Format: "HH:mm" (24-hour format)
    required: true,
  },
  closeTime: {
    type: String, // Format: "HH:mm" (24-hour format)
    required: true,
  },
  breakStart: {
    type: String, // Format: "HH:mm" (optional break/lunch time)
    default: null,
  },
  breakEnd: {
    type: String, // Format: "HH:mm"
    default: null,
  },
});

const AppointmentSettingsSchema = new mongoose.Schema(
  {
    // Schedule for each day of the week
    schedule: {
      type: [DayScheduleSchema],
      required: true,
      default: [
        // Default: Mon-Fri 9am-5pm with 12pm-1pm break, closed Sat-Sun
        { dayOfWeek: 0, isOpen: false, openTime: '09:00', closeTime: '17:00' },
        { dayOfWeek: 1, isOpen: true, openTime: '09:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 2, isOpen: true, openTime: '09:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 3, isOpen: true, openTime: '09:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 4, isOpen: true, openTime: '09:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 5, isOpen: true, openTime: '09:00', closeTime: '17:00', breakStart: '12:00', breakEnd: '13:00' },
        { dayOfWeek: 6, isOpen: false, openTime: '09:00', closeTime: '17:00' },
      ],
    },
    // Appointment duration options (in minutes)
    durationOptions: {
      type: [Number],
      default: [15, 30, 45, 60],
    },
    // Default duration (in minutes)
    defaultDuration: {
      type: Number,
      default: 30,
    },
    // Maximum days in advance customers can book
    maxAdvanceDays: {
      type: Number,
      default: 30,
    },
    // Allow same-day bookings
    allowSameDayBooking: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const AppointmentSettings =
  mongoose.models.AppointmentSettings ||
  mongoose.model('AppointmentSettings', AppointmentSettingsSchema);

export default AppointmentSettings;

