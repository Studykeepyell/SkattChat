import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`),
});

export const upload = multer({ storage });