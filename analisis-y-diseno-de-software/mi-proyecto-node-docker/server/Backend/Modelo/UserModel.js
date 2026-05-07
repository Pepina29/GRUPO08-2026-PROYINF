import BaseModel from './BaseModel.js';

/**
 * Modelo de usuario.
 * Solo interactúa con la tabla usuario.
 */
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
}

export const userModel = new UserModel();
