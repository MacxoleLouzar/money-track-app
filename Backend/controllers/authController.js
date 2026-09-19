import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../firebase.js';

const users = db.collection('users');

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

/** @route POST /api/auth/google */
export const googleAuth = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'accessToken required' });

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profileData = await profileRes.json();
    console.log('Google userinfo status:', profileRes.status);
    console.log('Google userinfo response:', profileData);

    if (!profileRes.ok) return res.status(401).json({ message: 'Invalid Google token', detail: profileData });
    const { sub: googleId, email, name, picture } = profileData;
    if (!googleId) return res.status(401).json({ message: 'Could not get Google profile', detail: profileData });

    const docId = `google_${googleId}`;
    const ref = users.doc(docId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        name: name || email.split('@')[0],
        email,
        picture: picture || '',
        provider: 'google',
        password: '',
        createdAt: new Date().toISOString(),
      });
    }
    const userData = snap.exists ? snap.data() : (await ref.get()).data();
    res.json({ token: makeToken(docId), user: { id: docId, name: userData.name, email } });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ message: 'Google sign-in failed', detail: err.message });
  }
};

/** @route POST /api/auth/signup */
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await users.where('email', '==', email).limit(1).get();
    if (!existing.empty) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const ref = await users.add({ name, email, password: hashed, createdAt: new Date().toISOString() });
    res.status(201).json({ token: makeToken(ref.id), user: { id: ref.id, name, email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route POST /api/auth/signin */
export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const snap = await users.where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(400).json({ message: 'Invalid credentials' });
    const doc = snap.docs[0];
    const user = doc.data();
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).json({ message: 'Invalid credentials' });
    res.json({ token: makeToken(doc.id), user: { id: doc.id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route GET /api/auth/profile */
export const getProfile = async (req, res) => {
  try {
    const doc = await users.doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    const { password, ...data } = doc.data();
    res.json({ id: doc.id, ...data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** @route PUT /api/auth/profile */
export const updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const doc = await users.doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ message: 'User not found' });
    const user = doc.data();
    const updates = {};
    if (name) updates.name = name;
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password required' });
      if (!(await bcrypt.compare(currentPassword, user.password)))
        return res.status(400).json({ message: 'Current password is incorrect' });
      updates.password = await bcrypt.hash(newPassword, 10);
    }
    await users.doc(req.user.id).update(updates);
    res.json({ id: req.user.id, name: updates.name || user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
