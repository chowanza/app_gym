import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const ConfigSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default models.Config || model('Config', ConfigSchema);
