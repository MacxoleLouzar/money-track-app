import express from 'express';
import auth from '../middleware/auth.js';
import { createWishlist, getWishlists, updateWishlist, deleteWishlist, addItem, removeItem, tickItem } from '../controllers/wishlistController.js';

const router = express.Router();

router.post('/', auth, createWishlist);
router.get('/', auth, getWishlists);
router.put('/:id', auth, updateWishlist);
router.delete('/:id', auth, deleteWishlist);
router.post('/:id/items', auth, addItem);
router.delete('/:id/items/:itemId', auth, removeItem);
router.patch('/:id/items/:itemId/tick', auth, tickItem);

export default router;
