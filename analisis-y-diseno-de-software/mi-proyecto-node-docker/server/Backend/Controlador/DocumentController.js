import { userDocumentModel } from '../models/index.js';

class DocumentController {
  constructor(model = userDocumentModel) {
    this.userDocumentModel = model;

    this.uploadDocs = this.uploadDocs.bind(this);
  }

  /**
   * POST /api/upload-docs
   * Recibe FormData con los archivos 'frontal' y 'trasera', además del 'rut'
   */
  async uploadDocs(req, res) {
    try {
      if (!req.files || !req.files.frontal || !req.files.trasera) {
        return res.status(400).json({ error: 'Faltan documentos por subir' });
      }

      const rutUsuario = req.body.rut;
      if (!rutUsuario) {
        return res.status(400).json({ error: 'No se proporcionó el RUT del usuario' });
      }

      const bufferFrontal = req.files.frontal[0].buffer;
      const mimeFrontal = req.files.frontal[0].mimetype;

      const bufferTrasera = req.files.trasera[0].buffer;
      const mimeTrasera = req.files.trasera[0].mimetype;

      const updatedUser = await this.userDocumentModel.updateByRut(rutUsuario, {
        frontalBuffer: bufferFrontal,
        frontalMime: mimeFrontal,
        traseraBuffer: bufferTrasera,
        traseraMime: mimeTrasera,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'Usuario no encontrado en la base de datos' });
      }

      console.log(`Documentos BLOB guardados para el RUT: ${rutUsuario}`);
      return res.json({ message: 'Documentos guardados con éxito' });
    } catch (error) {
      console.error('[POST /upload-docs]', error);
      return res.status(500).json({ error: 'Error interno al guardar los documentos' });
    }
  }
}

export default new DocumentController();
