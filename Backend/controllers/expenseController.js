import { db } from '../firebase.js';
import { uploadToStorage } from '../middleware/upload.js';
import { autoTickByExpense } from './wishlistController.js';

const CATEGORIES = ['grocery', 'transport', 'lunch', 'garment', 'furniture', 'rent', 'cosmetic', 'takeout', 'date', 'other'];

const col = (category) => db.collection(`expenses_${category}`);

const uploadFiles = async (files) => {
  const urls = {};
  if (files?.image) urls.image = await uploadToStorage(files.image[0], 'images');
  if (files?.slip) urls.slip = await uploadToStorage(files.slip[0], 'slips');
  if (files?.invoice) urls.invoice = await uploadToStorage(files.invoice[0], 'invoices');
  return urls;
};

/** @route POST /api/expenses/:category */
export const addExpense = async (req, res) => {
  try {
    const { category } = req.params;
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
    const fileUrls = await uploadFiles(req.files);
    const data = { ...req.body, ...fileUrls, user: req.user.id, date: new Date().toISOString() };
    const ref = await col(category).add(data);
    const itemName = data.item || data.foodType || data.restaurant || data.from || null;
    autoTickByExpense(req.user.id, category, itemName).catch(() => {});
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route GET /api/expenses/:category */
export const getExpenses = async (req, res) => {
  try {
    const { category } = req.params;
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
    const snap = await col(category).where('user', '==', req.user.id).orderBy('date', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route PUT /api/expenses/:category/:id */
export const updateExpense = async (req, res) => {
  try {
    const { category, id } = req.params;
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
    const doc = await col(category).doc(id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const fileUrls = await uploadFiles(req.files);
    const data = { ...req.body, ...fileUrls };
    await col(category).doc(id).update(data);
    res.json({ id, ...doc.data(), ...data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route DELETE /api/expenses/:category/:id */
export const deleteExpense = async (req, res) => {
  try {
    const { category, id } = req.params;
    if (!CATEGORIES.includes(category)) return res.status(400).json({ message: 'Invalid category' });
    const doc = await col(category).doc(id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await col(category).doc(id).delete();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getPeriodRange = (period, dateParam) => {
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
  return { start: start.toISOString(), end: end.toISOString() };
};

/** @route GET /api/expenses/summary/:period */
export const getSummary = async (req, res) => {
  try {
    const { period } = req.params;
    const { start, end } = getPeriodRange(period, req.query.date);
    const results = await Promise.all(
      CATEGORIES.map(async (category) => {
        const snap = await col(category)
          .where('user', '==', req.user.id)
          .where('date', '>=', start)
          .where('date', '<=', end)
          .get();
        const total = snap.docs.reduce((sum, d) => sum + (Number(d.data().price) || 0), 0);
        return { category, total, count: snap.size };
      })
    );
    const grandTotal = results.reduce((sum, r) => sum + r.total, 0);
    res.json({ period, grandTotal, breakdown: results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export { getPeriodRange };
