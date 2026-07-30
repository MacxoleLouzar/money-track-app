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
  store: String, onSale: Boolean, size: String, sizeValue: Number, barcode: String,
});

const transportSchema = new mongoose.Schema({
  ...base,
  from: String, destination: String,
  mode: { type: String, enum: ['Uber', 'Taxi', 'Train', 'Flight'] },
  price: Number, barcode: String,
});

const lunchSchema = new mongoose.Schema({
  ...base,
  foodType: String, store: String, price: Number, PersonBuyingForName: String, barcode: String,
});

const garmentSchema = new mongoose.Schema({
  ...base,
  item: String, store: String, price: Number, quantity: Number, barcode: String,
});

const furnitureSchema = new mongoose.Schema({
  ...base,
  item: String, store: String, price: Number, quantity: Number, barcode: String,
});

const rentSchema = new mongoose.Schema({
  ...base,
  price: Number, invoice: String, barcode: String,
});

const cosmeticSchema = new mongoose.Schema({
  ...base,
  item: String, price: Number, quantity: Number, store: String, barcode: String,
});

const takeoutSchema = new mongoose.Schema({
  ...base,
  item: String, store: String, price: Number, PersonBuyingForName: String, barcode: String,
});

const dateSchema = new mongoose.Schema({
  ...base,
  restaurant: String, foodDescription: String, price: Number, qauntity: Number, barcode: String,
});

const otherSchema = new mongoose.Schema({
  ...base,
  item: String, price: Number, store: String, description: String, barcode: String,
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
export const Other = mongoose.model('Other', otherSchema);
