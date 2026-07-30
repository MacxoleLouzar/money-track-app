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
