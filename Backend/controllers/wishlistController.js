import Wishlist from '../models/Wishlist.js';

export const createWishlist = async (req, res) => {
  try {
    const { name, period } = req.body;
    if (!name || !period) return res.status(400).json({ message: 'name and period required' });
    const wishlist = await Wishlist.create({ user: req.user.id, name, period, items: [] });
    res.status(201).json(wishlist);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(wishlists);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateWishlist = async (req, res) => {
  try {
    const { name, period } = req.body;
    const wishlist = await Wishlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { name, period },
      { new: true }
    );
    if (!wishlist) return res.status(404).json({ message: 'Not found' });
    res.json(wishlist);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const deleteWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const addItem = async (req, res) => {
  try {
    const { name, category, note } = req.body;
    if (!name || !category) return res.status(400).json({ message: 'name and category required' });
    const wishlist = await Wishlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $push: { items: { name, category, note, bought: false } } },
      { new: true }
    );
    if (!wishlist) return res.status(404).json({ message: 'Not found' });
    res.json(wishlist);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const removeItem = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $pull: { items: { _id: req.params.itemId } } },
      { new: true }
    );
    if (!wishlist) return res.status(404).json({ message: 'Not found' });
    res.json(wishlist);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

export const tickItem = async (req, res) => {
  try {
    const { bought } = req.body;
    const wishlist = await Wishlist.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id, 'items._id': req.params.itemId },
      { $set: { 'items.$.bought': bought, 'items.$.boughtAt': bought ? new Date() : null } },
      { new: true }
    );
    if (!wishlist) return res.status(404).json({ message: 'Not found' });
    res.json(wishlist);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Called internally after an expense is saved — auto-tick matching wishlist items
export const autoTickByExpense = async (userId, category, itemName) => {
  if (!itemName) return;
  const name = itemName.toLowerCase().trim();
  await Wishlist.updateMany(
    { user: userId, 'items.bought': false, 'items.category': category },
    {
      $set: {
        'items.$[el].bought': true,
        'items.$[el].boughtAt': new Date(),
      }
    },
    { arrayFilters: [{ 'el.bought': false, 'el.category': category, $expr: { $eq: [{ $toLower: { $trim: { input: '$el.name' } } }, name] } }] }
  );
};
