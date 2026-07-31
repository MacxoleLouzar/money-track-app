import Budget from '../models/Budget.js';
import {
  Grocery, Transport, Lunch, Garment,
  Furniture, Rent, Cosmetic, Takeout, DateExpense, Other
} from '../models/Expense.js';

const modelMap = {
  grocery: Grocery, transport: Transport, lunch: Lunch, garment: Garment,
  furniture: Furniture, rent: Rent, cosmetic: Cosmetic, takeout: Takeout,
  date: DateExpense, other: Other,
};

const getPeriodRange = (period, startDate) => {
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
  return { start, end: now };
};

export const createBudget = async (req, res) => {
  try {
    const { name, amount, period, categories } = req.body;
    if (!name || !amount || !period) return res.status(400).json({ message: 'name, amount and period required' });
    const budget = await Budget.create({
      user: req.user.id, name, amount, period,
      categories: categories || [],
      startDate: new Date(),
    });
    res.status(201).json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateBudget = async (req, res) => {
  try {
    const { name, amount, period, categories } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, amount, period, categories: categories || [] },
      { new: true, runValidators: true }
    );
    if (!budget) return res.status(404).json({ message: 'Not found' });
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBudget = async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getBudgetStatus = async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user.id });
    if (!budget) return res.status(404).json({ message: 'Not found' });

    const { start, end } = getPeriodRange(budget.period, budget.startDate);
    const filter = { user: req.user.id, date: { $gte: start, $lte: end } };

    const cats = budget.categories.length > 0 ? budget.categories : Object.keys(modelMap);
    const results = await Promise.all(cats.map(async cat => {
      const items = await modelMap[cat].find(filter);
      const total = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
      return { category: cat, total, count: items.length };
    }));

    const spent = results.reduce((sum, r) => sum + r.total, 0);
    const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    let alert = null;
    if (pct >= 100) alert = spent > budget.amount ? 'overdraft' : 'limit';
    else if (pct >= 75) alert = '75';
    else if (pct >= 50) alert = '50';

    res.json({
      _id: budget._id,
      name: budget.name,
      budget: budget.amount,
      period: budget.period,
      categories: budget.categories,
      spent: +spent.toFixed(2),
      remaining: +(budget.amount - spent).toFixed(2),
      percentage: +pct.toFixed(1),
      alert,
      breakdown: results,
      periodStart: start,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
