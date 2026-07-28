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

// Generate JWT Token
const generateToken = (userId: string, tokenVersion: number): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  return jwt.sign({ id: userId, tokenVersion }, JWT_SECRET, { expiresIn });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signUp = async (
  req: Request<{}, any, ISignUpBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please provide all required fields: name, email, password');
    }

    // 2. Validate email format
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    // 3. Check password length
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters long');
    }

    // 4. Check if user already exists (pre-check)
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400);
      throw new Error('Email address already exists');
    }

    // 5. Create new user with duplicate handling
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

    // 6. Generate token
    const token = generateToken(user._id.toString(), user.tokenVersion);

    // 7. Return response
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
};

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/signin or /api/auth/login
 * @access  Public
 */
export const signIn = async (
  req: Request<{}, any, ISignInBody>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Validate required fields
    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide both email and password');
    }

    // 2. Find user in database and explicitly include password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 3. Match passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // 4. Generate token
    const token = generateToken(user._id.toString(), user.tokenVersion);

    // 5. Return response
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
};

/**
 * @desc    Logout user and invalidate token
 * @route   POST /api/auth/logout
 * @access  Protected
 */
export const logout = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.user) {
      // Invalidate current JWT version by incrementing tokenVersion
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
};
