import mongoose from 'mongoose';

const { Schema, models, model, Types } = mongoose;

const AttendanceSchema = new Schema(
  {
    customer: { type: Types.ObjectId, ref: 'Customer', required: true, index: true },
    checkInTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.Attendance || model('Attendance', AttendanceSchema);
