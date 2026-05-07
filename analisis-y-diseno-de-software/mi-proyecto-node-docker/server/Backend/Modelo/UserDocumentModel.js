import BaseModel from './BaseModel.js';

/**
 * Modelo de documentos del usuario.
 * En esta base los documentos viven como columnas BYTEA/MIME en usuario.
 */
export default class UserDocumentModel extends BaseModel {
  async updateByRut(rut, { frontalBuffer, frontalMime, traseraBuffer, traseraMime }) {
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

    const { rows } = await this.query(sql, [
      frontalBuffer,
      frontalMime,
      traseraBuffer,
      traseraMime,
      rut,
    ]);

    return rows[0] ?? null;
  }
}

export const userDocumentModel = new UserDocumentModel();
