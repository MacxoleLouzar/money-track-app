import multer from 'multer';
import path from 'path';

/**
 * Multer disk storage configuration.
 * Saves uploaded files to the Backend/uploads/ directory.
 * Filenames are prefixed with a Unix timestamp to avoid collisions.
 */
const storage = multer.diskStorage({
  /** @param {Function} cb - Callback: cb(null, destinationFolder) */
  destination: (req, file, cb) => cb(null, 'uploads/'),
  /** @param {Function} cb - Callback: cb(null, generatedFilename) */
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

/**
 * Multer upload middleware.
 * Accepts files with extensions: jpeg, jpg, png, pdf, docx.
 * Files outside this allowlist are silently rejected (not uploaded).
 * Used on expense routes that accept image, slip, and invoice fields.
 * @example
 * // In a route:
 * router.post('/:category', auth, upload.fields([{ name: 'image' }, { name: 'slip' }]), addExpense);
 */
export default multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|docx/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
});
