import { Router } from 'express';
import { signUp, signIn, logout } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public auth routes
router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/login', signIn); // Alias for signin
router.post('/logout', logout);

// Protected route to fetch current authenticated user profile
router.get('/me', protect, (req: any, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
