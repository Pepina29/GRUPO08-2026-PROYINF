import { Router } from 'express';
import documentController from '../controllers/DocumentController.js';
import { uploadUserDocuments } from '../middlewares/uploadDocuments.js';

const router = Router();

router.post('/upload-docs', uploadUserDocuments, documentController.uploadDocs);

export default router;
