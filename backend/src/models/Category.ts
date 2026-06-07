import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  color: string;
  orderIndex: number;
  createdAt: Date;
}

const CategorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#00f0ff' },
  orderIndex: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
