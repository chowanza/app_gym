import mongoose from 'mongoose';

const { Schema, models, model, Types } = mongoose;

const AttendanceSchema = new Schema(
  {
    customer: { type: Types.ObjectId, ref: 'Customer', required: true, index: true },
    checkInTime: { type: Date, default: Date.now },
    // Auditoría: quién registró la asistencia
    createdBy: { type: Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true }
);

// Indexes for recent lookups and customer history
AttendanceSchema.index({ checkInTime: -1 });
AttendanceSchema.index({ customer: 1, checkInTime: -1 });

export default models.Attendance || model('Attendance', AttendanceSchema);
