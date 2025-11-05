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
  },
  { timestamps: true }
);

export default models.Payment || model('Payment', PaymentSchema);
