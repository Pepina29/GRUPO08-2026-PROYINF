import BaseModel from './BaseModel.js';
export default class UserModel extends BaseModel {
  async create({ rut, nombre, apellido, email, password }) {
    const sql = `
      INSERT INTO usuario (rut_cliente, nombre_cliente, apellido_cliente, email, contrasena)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING rut_cliente AS rut, nombre_cliente, apellido_cliente, email
    `;

    const params = [rut, nombre, apellido, email, password];
    const { rows } = await this.query(sql, params);
    return rows[0] ?? null;
  }

  async findByRut(rut, { includePassword = false } = {}) {
    const passwordColumn = includePassword ? ', contrasena' : '';

    const sql = `
      SELECT rut_cliente AS rut, nombre_cliente, apellido_cliente, email${passwordColumn}
      FROM usuario
      WHERE rut_cliente = $1
    `;

    const { rows } = await this.query(sql, [rut]);
    return rows[0] ?? null;
  }

  async guardarAutenticador(rut, autenticador) {
  const codigo = String(autenticador).padStart(6, "0");

  const sql = `
    UPDATE usuario
    SET autenticador = $2
    WHERE rut_cliente = $1
    RETURNING rut_cliente AS rut, autenticador
  `;

  const { rows } = await this.query(sql, [rut, codigo]);
  return rows[0] ?? null;
}

  async verificarAutenticador(rut, autenticador) {
    const sql = `
      SELECT 1
      FROM usuario
      WHERE rut_cliente = $1
        AND autenticador = $2
      LIMIT 1
    `;

    const params = [rut, String(autenticador).padStart(6, '0')];
    const { rows } = await this.query(sql, params);
    return rows.length > 0;
  }

  async tieneAutenticador(rut) {
  const sql = `
    SELECT 1
    FROM usuario
    WHERE rut_cliente = $1
      AND autenticador IS NOT NULL
      AND TRIM(autenticador) <> ''
    LIMIT 1
  `;

  const { rows } = await this.query(sql, [rut]);
  return rows.length > 0;
}

}

export const userModel = new UserModel();