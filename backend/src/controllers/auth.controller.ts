import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';

// Helper to wrap async route handlers and forward errors to global error middleware
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => 
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// Generate JWT Token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'supersecretjwtkey_change_in_production';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, secret, { expiresIn: expiresIn as any });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signUp = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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

  // 4. Check if user already exists
  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) {
    res.status(400);
    throw new Error('Email address already exists');
  }

  // 5. Create new user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
  });

  // 6. Generate token
  const token = generateToken(user._id.toString());

  // 7. Optional: Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 8. Return response
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
});

/**
 * @desc    Authenticate user and get token
 * @route   POST /api/auth/signin or /api/auth/login
 * @access  Public
 */
export const signIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
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
  const token = generateToken(user._id.toString());

  // 5. Set HTTP-Only Cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  // 6. Return response
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
});

/**
 * @desc    Logout user and clear cookie
 * @route   POST /api/auth/logout
 * @access  Public (or Protected)
 */
export const logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Clear the cookie
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
