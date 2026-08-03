import {
  Grocery, Transport, Lunch, Garment,
  Furniture, Rent, Cosmetic, Takeout, DateExpense,
  Other
} from '../models/Expense.js';
import { autoTickByExpense } from './wishlistController.js';

/** Maps category route param strings to their Mongoose models */
const models = {
  grocery: Grocery, transport: Transport, lunch: Lunch, garment: Garment,
  furniture: Furniture, rent: Rent, cosmetic: Cosmetic, takeout: Takeout,
  date: DateExpense, other: Other,
};

/**
 * Creates a new expense in the specified category.
 * Handles optional file uploads (image, slip, invoice) via multer.
 * After saving, triggers autoTickByExpense to tick matching wishlist items.
 * @route POST /api/expenses/:category
 * @param {string} req.params.category - Expense category key (e.g. 'grocery')
 * @param {object} req.body - Expense fields (varies by category)
 * @param {object} [req.files] - Optional uploaded files: image, slip, invoice
 * @returns {201} The created expense document
 * @returns {400} If category is invalid
 */
export const addExpense = async (req, res) => {
  try {
    const Model = models[req.params.category];
    if (!Model) return res.status(400).json({ message: 'Invalid category' });
    const data = { ...req.body, user: req.user.id };
    if (req.files?.image) data.image = req.files.image[0].path;
    if (req.files?.slip) data.slip = req.files.slip[0].path;
    if (req.files?.invoice) data.invoice = req.files.invoice[0].path;
    const expense = await Model.create(data);
    const itemName = data.item || data.foodType || data.restaurant || data.from || null;
    autoTickByExpense(req.user.id, req.params.category, itemName).catch(() => {});
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Returns all expenses for the authenticated user in a given category,
 * sorted by date descending (newest first).
 * @route GET /api/expenses/:category
 * @param {string} req.params.category - Expense category key
 * @returns {200} Array of expense documents
 * @returns {400} If category is invalid
 */
export const getExpenses = async (req, res) => {
  try {
    const Model = models[req.params.category];
    if (!Model) return res.status(400).json({ message: 'Invalid category' });
    const expenses = await Model.find({ user: req.user.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Updates an existing expense by ID.
 * Only updates the expense if it belongs to the authenticated user.
 * Handles optional file replacements for image, slip, invoice.
 * @route PUT /api/expenses/:category/:id
 * @param {string} req.params.category - Expense category key
 * @param {string} req.params.id - MongoDB ObjectId of the expense
 * @param {object} req.body - Updated expense fields
 * @returns {200} The updated expense document
 * @returns {404} If expense not found or not owned by user
 */
export const updateExpense = async (req, res) => {
  try {
    const Model = models[req.params.category];
    if (!Model) return res.status(400).json({ message: 'Invalid category' });
    const data = { ...req.body };
    if (req.files?.image) data.image = req.files.image[0].path;
    if (req.files?.slip) data.slip = req.files.slip[0].path;
    if (req.files?.invoice) data.invoice = req.files.invoice[0].path;
    const updated = await Model.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      data,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Deletes an expense by ID.
 * Only deletes if the expense belongs to the authenticated user.
 * @route DELETE /api/expenses/:category/:id
 * @param {string} req.params.category - Expense category key
 * @param {string} req.params.id - MongoDB ObjectId of the expense
 * @returns {200} { message: 'Deleted' }
 */
export const deleteExpense = async (req, res) => {
  try {
    const Model = models[req.params.category];
    if (!Model) return res.status(400).json({ message: 'Invalid category' });
    await Model.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Builds a MongoDB date filter for a given period and optional reference date.
 * @param {'daily'|'weekly'|'monthly'|'yearly'} period - The time period
 * @param {string} userId - The authenticated user's ID
 * @param {string} [dateParam] - ISO date string to anchor the period (defaults to today)
 * @returns {{ user: string, date: { $gte: Date, $lte: Date } }} Mongoose query filter
 */
const getPeriodFilter = (period, userId, dateParam) => {
  const ref = dateParam ? new Date(dateParam) : new Date();
  let start, end;
  if (period === 'daily') {
    start = new Date(ref); start.setHours(0, 0, 0, 0);
    end = new Date(ref); end.setHours(23, 59, 59, 999);
  } else if (period === 'weekly') {
    start = new Date(ref); start.setDate(ref.getDate() - 6); start.setHours(0, 0, 0, 0);
    end = new Date(ref); end.setHours(23, 59, 59, 999);
  } else if (period === 'monthly') {
    start = new Date(ref.getFullYear(), ref.getMonth(), 1);
    end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (period === 'yearly') {
    start = new Date(ref.getFullYear(), 0, 1);
    end = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
  }
  return { user: userId, date: { $gte: start, $lte: end } };
};

/**
 * Returns a spending summary for a given time period across all categories.
 * Queries all 10 expense models in parallel and aggregates totals.
 * @route GET /api/expenses/summary/:period
 * @param {'daily'|'weekly'|'monthly'|'yearly'} req.params.period - Time period
 * @param {string} [req.query.date] - ISO date string to anchor the period
 * @returns {200} { period, grandTotal, breakdown: [{ category, total, count }] }
 */
export const getSummary = async (req, res) => {
  try {
    const { period } = req.params;
    const filter = getPeriodFilter(period, req.user.id, req.query.date);
    const results = await Promise.all(
      Object.entries(models).map(async ([name, Model]) => {
        const items = await Model.find(filter);
        const total = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);
        return { category: name, total, count: items.length };
      })
    );
    const grandTotal = results.reduce((sum, r) => sum + r.total, 0);
    res.json({ period, grandTotal, breakdown: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
