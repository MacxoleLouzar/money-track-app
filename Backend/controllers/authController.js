import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Registers a new user.
 * Hashes the password with bcrypt, creates the user in MongoDB,
 * and returns a signed JWT token valid for 7 days.
 * @route POST /api/auth/signup
 * @param {string} req.body.name - Full name of the user
 * @param {string} req.body.email - Email address (must be unique)
 * @param {string} req.body.password - Plain text password (min recommended: 6 chars)
 * @returns {201} { token, user: { id, name, email } }
 * @returns {400} If email already exists
 */
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Authenticates an existing user.
 * Compares the provided password against the stored bcrypt hash.
 * Returns a signed JWT token valid for 7 days on success.
 * @route POST /api/auth/signin
 * @param {string} req.body.email - Registered email address
 * @param {string} req.body.password - Plain text password
 * @returns {200} { token, user: { id, name, email } }
 * @returns {400} If credentials are invalid
 */
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
