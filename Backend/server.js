import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import './firebase.js';

import authRoutes from './routes/auth.js';
import expenseRoutes from './routes/expenses.js';
import budgetRoutes from './routes/budget.js';
import wishlistRoutes from './routes/wishlist.js';

const app = express();

app.use(cors({
  origin: (origin, callback) => {
    const allowed = ['https://macxolelouzar.github.io', 'http://localhost:5173', 'http://localhost:5174'];
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Allow Google OAuth popup to communicate cross-origin
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.get('/', (req, res) => res.json({ status: 'MoneyTrack API running' }));

app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/wishlist', wishlistRoutes);

app.listen(process.env.PORT || 5000, () =>
  console.log(`Server running on port ${process.env.PORT || 5000}`)
);
