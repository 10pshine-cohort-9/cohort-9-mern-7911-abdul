import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: unknown) {
    next(error as any);
  }
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as any;
  if (!update) {
    return next();
  }

  try {
    if (update.password && typeof update.password === 'string') {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
    } else if (update.$set && update.$set.password && typeof update.$set.password === 'string') {
      const salt = await bcrypt.genSalt(10);
      update.$set.password = await bcrypt.hash(update.$set.password, salt);
    }
    next();
  } catch (error: unknown) {
    next(error as any);
  }
});

const handleDuplicateKeyError = (
  error: unknown,
  doc: unknown,
  next: (err?: any) => void
): void => {
  if (error && typeof error === 'object' && 'code' in error && (error as { code: unknown }).code === 11000) {
    next(new Error('Email address already exists'));
  } else {
    next(error as any);
  }
};

userSchema.post('save', handleDuplicateKeyError);
userSchema.post('findOneAndUpdate', handleDuplicateKeyError);

export const User = model<IUser>('User', userSchema);

