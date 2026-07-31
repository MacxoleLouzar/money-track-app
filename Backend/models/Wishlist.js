import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  note: String,
  bought: { type: Boolean, default: false },
  boughtAt: Date,
}, { _id: true });

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  items: [wishlistItemSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Wishlist', wishlistSchema);
