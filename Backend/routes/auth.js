import express from 'express';
import { signup, signin, getProfile, updateProfile, googleAuth } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = express.Router();
router.post('/signup', signup);
router.post('/signin', signin);
router.post('/google', googleAuth);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
export default router;
