import mongoose from 'mongoose';

const ALL_CATEGORIES = ['grocery', 'transport', 'lunch', 'garment', 'furniture', 'rent', 'cosmetic', 'takeout', 'date', 'other'];

const budgetSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  period: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  categories: [{ type: String, enum: ALL_CATEGORIES }],
  startDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Budget', budgetSchema);
