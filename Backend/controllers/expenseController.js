import {
  Grocery, Transport, Lunch, Garment,
  Furniture, Rent, Cosmetic, Takeout, DateExpense,
  Other
} from '../models/Expense.js';

const models = { grocery: Grocery, transport: Transport, lunch: Lunch, garment: Garment, furniture: Furniture, rent: Rent, cosmetic: Cosmetic, takeout: Takeout, date: DateExpense, other: Other };

export const addExpense = async (req, res) => {
  try {
    const Model = models[req.params.category];
    if (!Model) return res.status(400).json({ message: 'Invalid category' });
    const data = { ...req.body, user: req.user.id };
    if (req.files?.image) data.image = req.files.image[0].path;
    if (req.files?.slip) data.slip = req.files.slip[0].path;
    if (req.files?.invoice) data.invoice = req.files.invoice[0].path;
    const expense = await Model.create(data);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

const getPeriodFilter = (period, userId) => {
  const now = new Date();
  let start;
  if (period === 'daily') start = new Date(now.setHours(0, 0, 0, 0));
  else if (period === 'weekly') { start = new Date(now); start.setDate(now.getDate() - 7); }
  else if (period === 'monthly') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (period === 'yearly') start = new Date(now.getFullYear(), 0, 1);
  return { user: userId, date: { $gte: start } };
};

export const getSummary = async (req, res) => {
  try {
    const { period } = req.params;
    const filter = getPeriodFilter(period, req.user.id);
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
