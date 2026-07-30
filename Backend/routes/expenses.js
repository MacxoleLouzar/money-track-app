import express from 'express';
import auth from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { addExpense, getExpenses, deleteExpense, updateExpense, getSummary } from '../controllers/expenseController.js';

const router = express.Router();
const files = upload.fields([{ name: 'image' }, { name: 'slip' }, { name: 'invoice' }]);

router.get('/summary/:period', auth, getSummary);
router.post('/:category', auth, files, addExpense);
router.get('/:category', auth, getExpenses);
router.put('/:category/:id', auth, files, updateExpense);
router.delete('/:category/:id', auth, deleteExpense);

export default router;
