import mongoose from 'mongoose';

const { Schema, models, model, Types } = mongoose;

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    cedula: { type: String, required: true, unique: true, index: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    startDate: { type: Date, default: Date.now },
    membershipType: {
      type: String,
      enum: ['Gym', 'Xtrembike', 'Diario', 'Mensual', 'Otro'],
    },
    paymentStatus: {
      type: String,
      enum: ['Activo', 'Inactivo'],
      default: 'Inactivo',
    },
    membershipEndDate: { type: Date },
  },
  { timestamps: true }
);

export default models.Customer || model('Customer', CustomerSchema);
