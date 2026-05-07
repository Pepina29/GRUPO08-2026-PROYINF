import BaseModel from './BaseModel.js';

/**
 * Modelo de simulaciones.
 * Solo interactúa con la tabla user_simulation.
 */
export default class SimulationModel extends BaseModel {
  async findByRut(rut) {
    const sql = `
      SELECT id, rut_cliente AS rut, data, created_at
      FROM user_simulation
      WHERE rut_cliente = $1
      ORDER BY created_at DESC
    `;

    const { rows } = await this.query(sql, [rut]);
    return rows;
  }

  async countByRut(rut) {
    const sql = 'SELECT COUNT(*)::int AS count FROM user_simulation WHERE rut_cliente = $1';
    const { rows } = await this.query(sql, [rut]);
    return rows[0]?.count ?? 0;
  }

  async create({ rut, data }) {
    const sql = `
      INSERT INTO user_simulation (rut_cliente, data)
      VALUES ($1, $2)
      RETURNING id, rut_cliente AS rut, data, created_at
    `;

    const { rows } = await this.query(sql, [rut, data]);
    return rows[0] ?? null;
  }

  async deleteByIdAndRut({ id, rut }) {
    const sql = 'DELETE FROM user_simulation WHERE id = $1 AND rut_cliente = $2';
    const { rowCount } = await this.query(sql, [id, rut]);
    return rowCount > 0;
  }

  async deleteAllByRut(rut) {
    const sql = 'DELETE FROM user_simulation WHERE rut_cliente = $1';
    const { rowCount } = await this.query(sql, [rut]);
    return rowCount;
  }
}

export const simulationModel = new SimulationModel();
