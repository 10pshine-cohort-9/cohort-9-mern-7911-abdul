import { Schema, model, Document, CallbackError, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
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
    tokenVersion: {
      type: Number,
      default: 0,
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
  if (!update) return next();

  try {
    let passwordVal = update.password ?? update.$set?.password;
    if (typeof passwordVal === 'string') {
      if (passwordVal.length < 6) {
        return next(new Error('Password must be at least 6 characters long'));
      }
      const hashed = await bcrypt.hash(passwordVal, await bcrypt.genSalt(10));
      if (update.password !== undefined) {
        update.password = hashed;
      } else if (update.$set?.password !== undefined) {
        update.$set.password = hashed;
      }
    }
    next();
  } catch (error: unknown) {
    next(error as any);
  }
});

const handleDuplicate = (
  error: CallbackError & { code?: number },
  doc: HydratedDocument<IUser>,
  next: (err?: CallbackError) => void
): void => {
  if (error && error.code === 11000) {
    const err = new Error('Email address already exists') as any;
    err.code = 11000;
    next(err);
  } else {
    next(error);
  }
};

userSchema.post('save', handleDuplicate);
userSchema.post('findOneAndUpdate', handleDuplicate);

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export const User = model<IUser>('User', userSchema);
