import jwt from 'jsonwebtoken';

/**
 * JWT authentication middleware.
 * Extracts the Bearer token from the Authorization header,
 * verifies it against JWT_SECRET, and attaches the decoded
 * payload (containing user.id) to req.user for downstream handlers.
 * @middleware
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {401} If no token is provided or the token is invalid/expired
 */
export default (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};
