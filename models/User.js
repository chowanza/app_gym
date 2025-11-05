import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, index: true, trim: true },
    password: { type: String, required: true }, // Nota: hashear con bcrypt antes de guardar
    role: {
      type: String,
      enum: ['admin', 'editor'],
      default: 'editor',
      required: true,
    },
  },
  { timestamps: true }
);

export default models.User || model('User', UserSchema);
