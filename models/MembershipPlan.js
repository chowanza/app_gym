import mongoose from 'mongoose';

const MembershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del plan es requerido'],
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: 0,
  },
  durationValue: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  durationType: {
    type: String,
    enum: ['days', 'months'],
    default: 'months',
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

export default mongoose.models.MembershipPlan || mongoose.model('MembershipPlan', MembershipPlanSchema);
