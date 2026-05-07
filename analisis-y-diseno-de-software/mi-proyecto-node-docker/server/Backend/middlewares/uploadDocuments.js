import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const uploadUserDocuments = upload.fields([
  { name: 'frontal', maxCount: 1 },
  { name: 'trasera', maxCount: 1 },
]);
