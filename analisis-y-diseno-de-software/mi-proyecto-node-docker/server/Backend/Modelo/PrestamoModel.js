// server/Backend/Modelo/PrestamoModel.js
import BaseModel from "./BaseModel.js";

export default class PrestamoModel extends BaseModel {
  async crear({ idSolicitud, monto, tasa = 0.02, plazo, estado = "activo" }) {
    const sql = `
      INSERT INTO prestamo (
        id_solicitud,
        monto,
        tasa,
        plazo,
        estado
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id_prestamo AS "idPrestamo",
        id_solicitud AS "idSolicitud",
        monto,
        tasa,
        plazo,
        estado,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const params = [idSolicitud, monto, tasa, plazo, estado];
    const { rows } = await this.query(sql, params);

    return rows[0] ?? null;
  }

  async findById(idPrestamo) {
    const sql = `
      SELECT
        id_prestamo AS "idPrestamo",
        id_solicitud AS "idSolicitud",
        monto,
        tasa,
        plazo,
        estado,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM prestamo
      WHERE id_prestamo = $1
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idPrestamo]);
    return rows[0] ?? null;
  }

  async findByIdSolicitud(idSolicitud) {
    const sql = `
      SELECT
        id_prestamo AS "idPrestamo",
        id_solicitud AS "idSolicitud",
        monto,
        tasa,
        plazo,
        estado,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM prestamo
      WHERE id_solicitud = $1
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idSolicitud]);
    return rows[0] ?? null;
  }

  async findByIdSolicitudAndRut(idSolicitud, rutCliente) {
    const sql = `
      SELECT
        p.id_prestamo AS "idPrestamo",
        p.id_solicitud AS "idSolicitud",
        p.monto,
        p.tasa,
        p.plazo,
        p.estado,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt"
      FROM prestamo p
      INNER JOIN solicitud_prestamo s
        ON s.id_solicitud = p.id_solicitud
      WHERE p.id_solicitud = $1
        AND s.rut_cliente = $2
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idSolicitud, rutCliente]);
    return rows[0] ?? null;
  }

  async findByRutCliente(rutCliente) {
    const sql = `
      SELECT
        p.id_prestamo AS "idPrestamo",
        p.id_solicitud AS "idSolicitud",
        p.monto,
        p.tasa,
        p.plazo,
        p.estado,
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        s.rut_cliente AS "rutCliente",
        s.monto_cliente AS "montoSolicitud",
        s.sueldo_cliente AS "sueldoCliente",
        s.cant_cuotas AS "cantidadCuotas",
        s.estado AS "estadoSolicitud",
        s.fecha_solicitud AS "fechaSolicitud"
      FROM prestamo p
      INNER JOIN solicitud_prestamo s
        ON s.id_solicitud = p.id_solicitud
      WHERE s.rut_cliente = $1
      ORDER BY p.created_at DESC
    `;

    const { rows } = await this.query(sql, [rutCliente]);
    return rows;
  }

  async actualizarEstado(idPrestamo, estado) {
    const sql = `
      UPDATE prestamo
      SET estado = $2
      WHERE id_prestamo = $1
      RETURNING
        id_prestamo AS "idPrestamo",
        id_solicitud AS "idSolicitud",
        monto,
        tasa,
        plazo,
        estado,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const { rows } = await this.query(sql, [idPrestamo, estado]);
    return rows[0] ?? null;
  }
}