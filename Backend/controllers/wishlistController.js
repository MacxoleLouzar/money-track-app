import Wishlist from '../models/Wishlist.js';

/**
 * Creates a new wishlist for the authenticated user.
 * @route POST /api/wishlist
 * @param {string} req.body.name - Wishlist name (e.g. "Weekly Shopping")
 * @param {'daily'|'weekly'|'monthly'} req.body.period - Planning period
 * @returns {201} The created wishlist document
 * @returns {400} If name or period is missing
 */
export const createWishlist = async (req, res) => {
  try {
    const { name, period } = req.body;
    if (!name || !period) return res.status(400).json({ message: 'name and period required' });
    const wishlist = await Wishlist.create({ user: req.user.id, name, period, items: [] });
    res.status(201).json(wishlist);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/**
 * Returns all wishlists for the authenticated user, sorted newest first.
 * @route GET /api/wishlist
 * @returns {200} Array of wishlist documents with embedded items
 */
export const getWishlists = async (req, res) => {
  try {
    const wishlists = await Wishlist.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(wishlists);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/**
 * Updates a wishlist's name or period.
 * Only updates if the wishlist belongs to the authenticated user.
 * @route PUT /api/wishlist/:id
 * @param {string} req.params.id - MongoDB ObjectId of the wishlist
 * @returns {200} The updated wishlist document
 * @returns {404} If wishlist not found or not owned by user
 */
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

/**
 * Deletes a wishlist and all its items.
 * Only deletes if the wishlist belongs to the authenticated user.
 * @route DELETE /api/wishlist/:id
 * @param {string} req.params.id - MongoDB ObjectId of the wishlist
 * @returns {200} { message: 'Deleted' }
 */
export const deleteWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

/**
 * Adds a new item to a wishlist.
 * @route POST /api/wishlist/:id/items
 * @param {string} req.params.id - MongoDB ObjectId of the wishlist
 * @param {string} req.body.name - Item name (e.g. "Milk")
 * @param {string} req.body.category - Expense category key (e.g. "grocery")
 * @param {string} [req.body.note] - Optional note (e.g. "2L full cream")
 * @returns {200} The updated wishlist document
 * @returns {400} If name or category is missing
 */
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

/**
 * Removes a specific item from a wishlist by item ID.
 * @route DELETE /api/wishlist/:id/items/:itemId
 * @param {string} req.params.id - MongoDB ObjectId of the wishlist
 * @param {string} req.params.itemId - MongoDB ObjectId of the item to remove
 * @returns {200} The updated wishlist document
 */
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

/**
 * Manually ticks or unticks a wishlist item.
 * Sets boughtAt timestamp when marking as bought, clears it when unticking.
 * @route PATCH /api/wishlist/:id/items/:itemId/tick
 * @param {string} req.params.id - MongoDB ObjectId of the wishlist
 * @param {string} req.params.itemId - MongoDB ObjectId of the item
 * @param {boolean} req.body.bought - true to tick, false to untick
 * @returns {200} The updated wishlist document
 */
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

/**
 * Automatically ticks wishlist items when a matching expense is saved.
 * Called internally by expenseController after addExpense succeeds.
 * Matches items case-insensitively by name and category.
 * Uses MongoDB arrayFilters to update only the matching subdocument.
 * @param {string} userId - The authenticated user's ID
 * @param {string} category - The expense category key (e.g. 'grocery')
 * @param {string|null} itemName - The item name from the expense (e.g. 'Milk')
 * @returns {Promise<void>}
 */
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
