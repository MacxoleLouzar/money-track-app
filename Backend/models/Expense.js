import mongoose from 'mongoose';

const base = {
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  image: String,
  slip: String,
};

const grocerySchema = new mongoose.Schema({
  ...base,
  item: String, quantity: Number, price: Number,
  store: String, onSale: Boolean,
});

const transportSchema = new mongoose.Schema({
  ...base,
  from: String, destination: String,
  mode: { type: String, enum: ['Uber', 'Taxi', 'Train', 'Flight'] },
  price: Number,
});

const lunchSchema = new mongoose.Schema({
  ...base,
  foodType: String, store: String, price: Number,
});

const garmentSchema = new mongoose.Schema({
  ...base,
  item: String, store: String, price: Number, quantity: Number,
});

const furnitureSchema = new mongoose.Schema({
  ...base,
  item: String, store: String, price: Number, quantity: Number,
});

const rentSchema = new mongoose.Schema({
  ...base,
  price: Number, invoice: String,
});

const cosmeticSchema = new mongoose.Schema({
  ...base,
  item: String, price: Number, quantity: Number, store: String,
});

const takeoutSchema = new mongoose.Schema({
  ...base,
  item: String, store: String, price: Number,
});

const dateSchema = new mongoose.Schema({
  ...base,
  restaurant: String, foodDescription: String, price: Number,
});

export const Grocery = mongoose.model('Grocery', grocerySchema);
export const Transport = mongoose.model('Transport', transportSchema);
export const Lunch = mongoose.model('Lunch', lunchSchema);
export const Garment = mongoose.model('Garment', garmentSchema);
export const Furniture = mongoose.model('Furniture', furnitureSchema);
export const Rent = mongoose.model('Rent', rentSchema);
export const Cosmetic = mongoose.model('Cosmetic', cosmeticSchema);
export const Takeout = mongoose.model('Takeout', takeoutSchema);
export const DateExpense = mongoose.model('DateExpense', dateSchema);
