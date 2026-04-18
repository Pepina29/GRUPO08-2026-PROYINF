// server/routes/documents.js
import { Router } from 'express';
import multer from 'multer';
import pool from '../../db.js'; // Ajusta la ruta a tu db.js si es necesario

const router = Router();

// 1. Configurar Multer para usar Memoria (RAM)
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /api/upload-docs
 * Recibe FormData con los archivos 'frontal' y 'trasera', además del 'rut'
 */
router.post('/upload-docs', upload.fields([
  { name: 'frontal', maxCount: 1 }, 
  { name: 'trasera', maxCount: 1 }
]), async (req, res) => {
  try {
    // Verificar que llegaron los archivos
    if (!req.files || !req.files['frontal'] || !req.files['trasera']) {
      return res.status(400).json({ error: "Faltan documentos por subir" });
    }

    // Verificar que llegó el RUT
    const rutUsuario = req.body.rut;
    if (!rutUsuario) {
      return res.status(400).json({ error: "No se proporcionó el RUT del usuario" });
    }

    // 2. Extraer los BLOBs y los mimetypes
    const bufferFrontal = req.files['frontal'][0].buffer;
    const mimeFrontal = req.files['frontal'][0].mimetype;

    const bufferTrasera = req.files['trasera'][0].buffer;
    const mimeTrasera = req.files['trasera'][0].mimetype;

    // 3. Insertar en la Base de Datos (PostgreSQL)
    const sql = `
      UPDATE usuario 
      SET 
        doc_frontal_bin = $1, 
        doc_frontal_mime = $2, 
        doc_trasera_bin = $3, 
        doc_trasera_mime = $4,
        updated_at = now()
      WHERE rut_cliente = $5
      RETURNING rut_cliente;
    `;

    const { rowCount } = await pool.query(sql, [
      bufferFrontal, 
      mimeFrontal, 
      bufferTrasera, 
      mimeTrasera, 
      rutUsuario
    ]);

    if (rowCount === 0) {
      return res.status(404).json({ error: "Usuario no encontrado en la base de datos" });
    }

    console.log(`Documentos BLOB guardados para el RUT: ${rutUsuario}`);
    res.json({ message: "Documentos guardados con éxito" });

  } catch (error) {
    console.error('[POST /upload-docs]', error);
    res.status(500).json({ error: "Error interno al guardar los documentos" });
  }
});

export default router;