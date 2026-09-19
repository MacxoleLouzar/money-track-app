import multer from 'multer';
import path from 'path';
import { bucket } from '../firebase.js';

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|docx/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});

export default upload;

/**
 * Uploads a file buffer to Firebase Storage and returns its public URL.
 * @param {Express.Multer.File} file - Multer file object (memory storage)
 * @param {string} folder - Storage folder name (e.g. 'images', 'slips')
 * @returns {Promise<string>} Public download URL
 */
export const uploadToStorage = async (file, folder) => {
  const filename = `${folder}/${Date.now()}-${file.originalname}`;
  const fileRef = bucket.file(filename);
  await fileRef.save(file.buffer, { contentType: file.mimetype });
  await fileRef.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${filename}`;
};
