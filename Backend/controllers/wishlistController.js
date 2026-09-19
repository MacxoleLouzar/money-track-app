import { db } from '../firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const wishlists = db.collection('wishlists');

/** @route POST /api/wishlist */
export const createWishlist = async (req, res) => {
  try {
    const { name, period } = req.body;
    if (!name || !period) return res.status(400).json({ message: 'name and period required' });
    const data = { user: req.user.id, name, period, items: [], createdAt: new Date().toISOString() };
    const ref = await wishlists.add(data);
    res.status(201).json({ id: ref.id, ...data });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** @route GET /api/wishlist */
export const getWishlists = async (req, res) => {
  try {
    const snap = await wishlists.where('user', '==', req.user.id).orderBy('createdAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** @route PUT /api/wishlist/:id */
export const updateWishlist = async (req, res) => {
  try {
    const doc = await wishlists.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const { name, period } = req.body;
    await wishlists.doc(req.params.id).update({ name, period });
    res.json({ id: req.params.id, ...doc.data(), name, period });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** @route DELETE /api/wishlist/:id */
export const deleteWishlist = async (req, res) => {
  try {
    const doc = await wishlists.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    await wishlists.doc(req.params.id).delete();
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** @route POST /api/wishlist/:id/items */
export const addItem = async (req, res) => {
  try {
    const { name, category, note } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'name and category required' });
    const doc = await wishlists.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const item = { id: Date.now().toString(), name, category, note: note || '', bought: false, boughtAt: null };
    await wishlists.doc(req.params.id).update({ items: FieldValue.arrayUnion(item) });
    const updated = await wishlists.doc(req.params.id).get();
    res.json({ id: req.params.id, ...updated.data() });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** @route DELETE /api/wishlist/:id/items/:itemId */
export const removeItem = async (req, res) => {
  try {
    const doc = await wishlists.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const items = doc.data().items.filter(i => i.id !== req.params.itemId);
    await wishlists.doc(req.params.id).update({ items });
    res.json({ id: req.params.id, ...doc.data(), items });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** @route PATCH /api/wishlist/:id/items/:itemId/tick */
export const tickItem = async (req, res) => {
  try {
    const { bought } = req.body;
    const doc = await wishlists.doc(req.params.id).get();
    if (!doc.exists || doc.data().user !== req.user.id) return res.status(404).json({ message: 'Not found' });
    const items = doc.data().items.map(i =>
      i.id === req.params.itemId ? { ...i, bought, boughtAt: bought ? new Date().toISOString() : null } : i
    );
    await wishlists.doc(req.params.id).update({ items });
    res.json({ id: req.params.id, ...doc.data(), items });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/** Called internally by expenseController after addExpense */
export const autoTickByExpense = async (userId, category, itemName) => {
  if (!itemName) return;
  const name = itemName.toLowerCase().trim();
  const snap = await wishlists.where('user', '==', userId).get();
  for (const doc of snap.docs) {
    const data = doc.data();
    const updated = data.items.map(i =>
      !i.bought && i.category === category && i.name.toLowerCase().trim() === name
        ? { ...i, bought: true, boughtAt: new Date().toISOString() }
        : i
    );
    if (updated.some((i, idx) => i.bought !== data.items[idx].bought)) {
      await wishlists.doc(doc.id).update({ items: updated });
    }
  }
};
