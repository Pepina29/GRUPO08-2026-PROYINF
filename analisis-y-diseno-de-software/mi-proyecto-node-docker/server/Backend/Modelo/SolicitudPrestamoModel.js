// Backend/Modelo/SolicitudPrestamoModel.js
import BaseModel from "./BaseModel.js";

class SolicitudPrestamoModel extends BaseModel {
  async create(data) {
    return this.crear(data);
  }

  async crear({
    rutCliente,
    rut_cliente,
    rut,
    montoCliente,
    monto_cliente,
    monto,
    sueldoCliente,
    sueldo_cliente,
    sueldo,
    cantCuotas,
    cant_cuotas,
    cantidadCuotas,
    cuotas,
    estado = "pendiente",
  }) {
    const rutFinal = rutCliente || rut_cliente || rut;
    const montoFinal = montoCliente || monto_cliente || monto;
    const sueldoFinal = sueldoCliente || sueldo_cliente || sueldo;
    const cuotasFinal = cantCuotas || cant_cuotas || cantidadCuotas || cuotas;

    const sql = `
      INSERT INTO solicitud_prestamo (
        rut_cliente,
        monto_cliente,
        sueldo_cliente,
        estado,
        cant_cuotas
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id_solicitud AS "idSolicitud",
        rut_cliente AS "rutCliente",
        monto_cliente AS "monto",
        sueldo_cliente AS "sueldo",
        estado,
        cant_cuotas AS "cantidadCuotas",
        fecha_solicitud AS "fechaSolicitud",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const params = [
      rutFinal,
      montoFinal,
      sueldoFinal,
      estado,
      cuotasFinal,
    ];

    const { rows } = await this.query(sql, params);
    return rows[0] ?? null;
  }

  async findById(idSolicitud) {
    const sql = `
      SELECT
        s.id_solicitud AS "idSolicitud",
        s.rut_cliente AS "rutCliente",
        s.monto_cliente AS "monto",
        s.sueldo_cliente AS "sueldo",
        s.estado,
        s.cant_cuotas AS "cantidadCuotas",
        s.fecha_solicitud AS "fechaSolicitud",
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        e.id_evaluacion AS "idEvaluacion",
        e.riesgo,
        p.id_prestamo AS "idPrestamo",
        p.estado AS "estadoPrestamo"
      FROM solicitud_prestamo s
      LEFT JOIN evaluacion e
        ON e.id_solicitud = s.id_solicitud
      LEFT JOIN prestamo p
        ON p.id_solicitud = s.id_solicitud
      WHERE s.id_solicitud = $1
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idSolicitud]);
    return rows[0] ?? null;
  }

  async findByIdAndRut(idSolicitud, rutCliente) {
    const sql = `
      SELECT
        s.id_solicitud AS "idSolicitud",
        s.rut_cliente AS "rutCliente",
        s.monto_cliente AS "monto",
        s.sueldo_cliente AS "sueldo",
        s.estado,
        s.cant_cuotas AS "cantidadCuotas",
        s.fecha_solicitud AS "fechaSolicitud",
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        e.id_evaluacion AS "idEvaluacion",
        e.riesgo,
        p.id_prestamo AS "idPrestamo",
        p.estado AS "estadoPrestamo"
      FROM solicitud_prestamo s
      LEFT JOIN evaluacion e
        ON e.id_solicitud = s.id_solicitud
      LEFT JOIN prestamo p
        ON p.id_solicitud = s.id_solicitud
      WHERE s.id_solicitud = $1
        AND s.rut_cliente = $2
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idSolicitud, rutCliente]);
    return rows[0] ?? null;
  }

  async findByRutCliente(rutCliente) {
    const sql = `
      SELECT
        s.id_solicitud AS "idSolicitud",
        s.rut_cliente AS "rutCliente",
        s.monto_cliente AS "monto",
        s.sueldo_cliente AS "sueldo",
        s.estado,
        s.cant_cuotas AS "cantidadCuotas",
        s.fecha_solicitud AS "fechaSolicitud",
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        e.id_evaluacion AS "idEvaluacion",
        e.riesgo,
        p.id_prestamo AS "idPrestamo",
        p.estado AS "estadoPrestamo"
      FROM solicitud_prestamo s
      LEFT JOIN evaluacion e
        ON e.id_solicitud = s.id_solicitud
      LEFT JOIN prestamo p
        ON p.id_solicitud = s.id_solicitud
      WHERE s.rut_cliente = $1
      ORDER BY s.fecha_solicitud DESC
    `;

    const { rows } = await this.query(sql, [rutCliente]);
    return rows;
  }

  async findAll() {
    const sql = `
      SELECT
        s.id_solicitud AS "idSolicitud",
        s.rut_cliente AS "rutCliente",
        s.monto_cliente AS "monto",
        s.sueldo_cliente AS "sueldo",
        s.estado,
        s.cant_cuotas AS "cantidadCuotas",
        s.fecha_solicitud AS "fechaSolicitud",
        s.created_at AS "createdAt",
        s.updated_at AS "updatedAt",
        e.id_evaluacion AS "idEvaluacion",
        e.riesgo,
        p.id_prestamo AS "idPrestamo",
        p.estado AS "estadoPrestamo"
      FROM solicitud_prestamo s
      LEFT JOIN evaluacion e
        ON e.id_solicitud = s.id_solicitud
      LEFT JOIN prestamo p
        ON p.id_solicitud = s.id_solicitud
      ORDER BY s.fecha_solicitud DESC
    `;

    const { rows } = await this.query(sql);
    return rows;
  }

  async cambiarEstado(idSolicitud, rutCliente, estado) {
    const sql = `
      UPDATE solicitud_prestamo
      SET estado = $3
      WHERE id_solicitud = $1
        AND rut_cliente = $2
      RETURNING
        id_solicitud AS "idSolicitud",
        rut_cliente AS "rutCliente",
        monto_cliente AS "monto",
        sueldo_cliente AS "sueldo",
        estado,
        cant_cuotas AS "cantidadCuotas",
        fecha_solicitud AS "fechaSolicitud",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const { rows } = await this.query(sql, [idSolicitud, rutCliente, estado]);
    return rows[0] ?? null;
  }

  async marcarComoPedido(idSolicitud, rutCliente) {
    const sql = `
      UPDATE solicitud_prestamo
      SET estado = 'pedido'
      WHERE id_solicitud = $1
        AND rut_cliente = $2
        AND LOWER(estado) IN ('aceptada', 'aceptado', 'aprobada', 'aprobado')
      RETURNING
        id_solicitud AS "idSolicitud",
        rut_cliente AS "rutCliente",
        monto_cliente AS "monto",
        sueldo_cliente AS "sueldo",
        estado,
        cant_cuotas AS "cantidadCuotas",
        fecha_solicitud AS "fechaSolicitud",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const { rows } = await this.query(sql, [idSolicitud, rutCliente]);
    return rows[0] ?? null;
  }

  async marcarComoAceptada(idSolicitud, rutCliente) {
    return this.cambiarEstado(idSolicitud, rutCliente, "aceptada");
  }

  async marcarComoRechazada(idSolicitud, rutCliente) {
    return this.cambiarEstado(idSolicitud, rutCliente, "rechazada");
  }

  async eliminar(idSolicitud, rutCliente) {
    const sql = `
      DELETE FROM solicitud_prestamo
      WHERE id_solicitud = $1
        AND rut_cliente = $2
      RETURNING
        id_solicitud AS "idSolicitud",
        rut_cliente AS "rutCliente",
        monto_cliente AS "monto",
        sueldo_cliente AS "sueldo",
        estado,
        cant_cuotas AS "cantidadCuotas",
        fecha_solicitud AS "fechaSolicitud",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    const { rows } = await this.query(sql, [idSolicitud, rutCliente]);
    return rows[0] ?? null;
  }
}

export const solicitudPrestamoModel = new SolicitudPrestamoModel();

export default SolicitudPrestamoModel;