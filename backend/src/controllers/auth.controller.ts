import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models/user.model';
import { AuthRequest } from '../middleware/auth.middleware';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is required during application startup.');
}

export interface ISignUpBody {
  name?: string;
  email?: string;
  password?: string;
}

export interface ISignInBody {
  email?: string;
  password?: string;
}

const generateToken = (userId: string, tokenVersion: number): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign({ id: userId, tokenVersion }, JWT_SECRET, { expiresIn });
};

export class AuthController {
  static async signUp(
    req: Request<{}, any, ISignUpBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please provide all required fields: name, email, password');
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(email)) {
        res.status(400);
        throw new Error('Please enter a valid email address');
      }

      if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
      }

      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        res.status(400);
        throw new Error('Email address already exists');
      }

      let user;
      try {
        user = await User.create({
          name,
          email: email.toLowerCase(),
          password,
        });
      } catch (dbError: any) {
        if (dbError && (dbError.code === 11000 || dbError.message?.includes('duplicate key'))) {
          res.status(400);
          throw new Error('Email address already exists');
        }
        throw dbError;
      }

      const token = generateToken(user._id.toString(), user.tokenVersion);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async signIn(
    req: Request<{}, any, ISignInBody>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400);
        throw new Error('Please provide both email and password');
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        res.status(401);
        throw new Error('Invalid email or password');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401);
        throw new Error('Invalid email or password');
      }

      const token = generateToken(user._id.toString(), user.tokenVersion);

      res.status(200).json({
        success: true,
        message: 'Signed in successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (req.user) {
        req.user.tokenVersion += 1;
        await req.user.save();
      }

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
