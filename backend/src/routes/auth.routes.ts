import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { protect, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/signup', AuthController.signUp);
router.post('/signin', AuthController.signIn);
router.post('/login', AuthController.signIn);

router.post('/logout', protect, AuthController.logout);

router.get('/me', protect, (req: AuthRequest, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

export default router;
