import mongoose, { Document, Schema } from 'mongoose';

export interface IUrl extends Document {
  originalUrl: string;
  shortCode: string;
  visitCount: number;
  userId: string;
  userEmail: string;
  createdAt: Date;
  updatedAt: Date;
}

const urlSchema: Schema = new Schema({
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  visitCount: {
    type: Number,
    default: 0
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

export const Url = mongoose.model<IUrl>('Url', urlSchema);
