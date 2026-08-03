import Budget from '../models/Budget.js';
import {
  Grocery, Transport, Lunch, Garment,
  Furniture, Rent, Cosmetic, Takeout, DateExpense, Other
} from '../models/Expense.js';

/** Maps category keys to Mongoose expense models for spending calculations */
const modelMap = {
  grocery: Grocery, transport: Transport, lunch: Lunch, garment: Garment,
  furniture: Furniture, rent: Rent, cosmetic: Cosmetic, takeout: Takeout,
  date: DateExpense, other: Other,
};

/**
 * Calculates the start and end dates for the current budget period.
 * For weekly budgets, advances the start date in 7-day increments from
 * the budget's creation date until the current period is reached.
 * @param {'daily'|'weekly'|'monthly'} period - Budget period type
 * @param {Date} startDate - The date the budget was created
 * @returns {{ start: Date, end: Date }} The current period's date range
 */
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

/**
 * Creates a new named budget for the authenticated user.
 * @route POST /api/budget
 * @param {string} req.body.name - Budget name (e.g. "Monthly Groceries")
 * @param {number} req.body.amount - Budget limit in Rands
 * @param {'daily'|'weekly'|'monthly'} req.body.period - Tracking period
 * @param {string[]} [req.body.categories] - Category keys to track (empty = all)
 * @returns {201} The created budget document
 * @returns {400} If name, amount, or period is missing
 */
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

/**
 * Returns all budgets for the authenticated user, sorted newest first.
 * @route GET /api/budget
 * @returns {200} Array of budget documents
 */
export const getBudgets = async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Updates an existing budget's name, amount, period, or categories.
 * Only updates if the budget belongs to the authenticated user.
 * @route PUT /api/budget/:id
 * @param {string} req.params.id - MongoDB ObjectId of the budget
 * @returns {200} The updated budget document
 * @returns {404} If budget not found or not owned by user
 */
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

/**
 * Deletes a budget by ID.
 * Only deletes if the budget belongs to the authenticated user.
 * @route DELETE /api/budget/:id
 * @param {string} req.params.id - MongoDB ObjectId of the budget
 * @returns {200} { message: 'Deleted' }
 */
export const deleteBudget = async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Calculates the live spending status for a specific budget.
 * Queries all tracked expense categories within the current budget period,
 * computes total spent, remaining balance, percentage used, and alert level.
 * Alert levels: '50' (≥50%), '75' (≥75%), 'limit' (=100%), 'overdraft' (>100%).
 * @route GET /api/budget/:id/status
 * @param {string} req.params.id - MongoDB ObjectId of the budget
 * @returns {200} {
 *   _id, name, budget, period, categories,
 *   spent, remaining, percentage, alert,
 *   breakdown: [{ category, total, count }],
 *   periodStart
 * }
 * @returns {404} If budget not found or not owned by user
 */
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
