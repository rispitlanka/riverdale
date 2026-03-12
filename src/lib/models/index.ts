// Import all models to ensure they are registered with Mongoose
// This file should be imported before using any populate() calls

import Category from './Category';
import Metal from './Metal';
import Request from './Request';
import Order from './Order';
import Appointment from './Appointment';
import AppointmentSettings from './AppointmentSettings';
import BlockedSlot from './BlockedSlot';
import Tag from './Tag';

// Export all models
export {
  Category,
  Metal,
  Request,
  Order,
  Appointment,
  AppointmentSettings,
  BlockedSlot,
  Tag,
};

// Ensure models are registered by accessing them
export default {
  Category,
  Metal,
  Request,
  Order,
  Appointment,
  AppointmentSettings,
  BlockedSlot,
  Tag,
};
