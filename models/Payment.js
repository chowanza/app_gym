import mongoose from 'mongoose';

const { Schema, models, model, Types } = mongoose;

const PaymentSchema = new Schema(
  {
    customer: { type: Types.ObjectId, ref: 'Customer', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ['Efectivo', 'Pago Movil', 'Otro'],
      required: true,
    },
    referenceNumber: { type: String, trim: true }, // usado para Pago Movil
    membershipMonths: { type: Number, default: 1, min: 1 },
    // Snapshot del nuevo vencimiento tras aplicar este pago
    membershipEndAfter: { type: Date },
    // Auditoría: quién registró el pago
    createdBy: { type: Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

// Indexes to speed up reporting and filters
PaymentSchema.index({ paymentDate: -1 });
PaymentSchema.index({ customer: 1, paymentDate: -1 });
// Evitar referencias duplicadas en pagos por Pago Movil
PaymentSchema.index(
  { referenceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      paymentMethod: 'Pago Movil',
      referenceNumber: { $type: 'string', $ne: '' },
    },
  }
);

export default models.Payment || model('Payment', PaymentSchema);
