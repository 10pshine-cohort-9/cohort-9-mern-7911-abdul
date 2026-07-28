import { Schema, model, Document } from 'mongoose';

export interface INote extends Document {
  title: string;
  content: string;
  tags: string[];
  isPinned: boolean;
  userId: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Added index on userId for fast retrieval of user notes
noteSchema.index({ userId: 1 });

export const Note = model<INote>('Note', noteSchema);
