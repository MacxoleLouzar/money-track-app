import express from 'express';
import auth from '../middleware/auth.js';
import { createBudget, getBudgets, updateBudget, deleteBudget, getBudgetStatus } from '../controllers/budgetController.js';

const router = express.Router();

router.post('/', auth, createBudget);
router.get('/', auth, getBudgets);
router.get('/:id/status', auth, getBudgetStatus);
router.put('/:id', auth, updateBudget);
router.delete('/:id', auth, deleteBudget);

export default router;
