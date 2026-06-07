import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  email: string;
  displayName: string;
  refreshToken: string; // Offline access token
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, trim: true },
  displayName: { type: String, default: '' },
  refreshToken: { type: String, required: true }, // Long-lived refresh token
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
