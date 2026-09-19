import { db } from '../firebase.js';
import { getPeriodRange } from './expenseController.js';

const budgets = db.collection('budgets');
const CATEGORIES = ['grocery', 'transport', 'lunch', 'garment', 'furniture', 'rent', 'cosmetic', 'takeout', 'date', 'other'];

const getBudgetPeriodRange = (period, startDate) => {
  const now = new Date();
  let start;
  if (period === 'daily') {
    start = new Date(now); start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    start = new Date(startDate);
    while (true) {
      const next = new Date(start); next.setDate(next.getDate() + 7);
      if (next > now) break;
      start = next;
    }
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString(), end: now.toISOString() };
};

/** @route POST /api/budget */
export const createBudget = async (req, res) => {
  try {
    const { name, amount, period, categories } = req.body;
    if (!name || !amount || !period) return res.status(400).json({ message: 'name, amount and period required' });
    const data = { user: req.user.id, name, amount, period, categories: categories || [], startDate: new Date().toISOString(), createdAt: new Date().toISOString() };
    const ref = await budgets.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route GET /api/budget */
export const getBudgets = async (req, res) => {
  try {
    const snap = await budgets.where('user', '==', req.user.id).orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route PUT /api/budget/:id */
export const updateBudget = async (req, res) => {
  try {
    const doc = await budgets.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const { name, amount, period, categories } = req.body;
    const updates = { name, amount, period, categories: categories || [] };
    await budgets.doc(req.params.id).update(updates);
    res.json({ id: req.params.id, ...doc.data(), ...updates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route DELETE /api/budget/:id */
export const deleteBudget = async (req, res) => {
  try {
    const doc = await budgets.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await budgets.doc(req.params.id).delete();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route GET /api/budget/:id/status */
export const getBudgetStatus = async (req, res) => {
  try {
    const doc = await budgets.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const budget = doc.data();
    const { start, end } = getBudgetPeriodRange(budget.period, budget.startDate);
    const cats = budget.categories.length > 0 ? budget.categories : CATEGORIES;

    const results = await Promise.all(cats.map(async (category) => {
      const snap = await db.collection(`expenses_${category}`)
        .where('user', '==', req.user.id)
        .where('date', '>=', start)
        .where('date', '<=', end)
        .get();
      const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().price) || 0), 0);
      return { category, total, count: snap.size };
    }));

    const spent = results.reduce((sum, r) => sum + r.total, 0);
    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    let alert = null;
    if (pct >= 100) alert = spent > budget.amount ? 'overdraft' : 'limit';
    else if (pct >= 75) alert = '75';
    else if (pct >= 50) alert = '50';

    res.json({
      id: doc.id, name: budget.name, budget: budget.amount,
      period: budget.period, categories: budget.categories,
      spent: +spent.toFixed(2), remaining: +(budget.amount - spent).toFixed(2),
      percentage: +pct.toFixed(1), alert, breakdown: results, periodStart: start,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
