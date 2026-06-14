import BaseModel from './BaseModel.js';
import { userModel } from './UserModel.js';

export default class EvaluacionModel extends BaseModel {
  async validarSolicitudDelUsuario({ rut, idSolicitud }) {
    const usuario = await userModel.findByRut(rut);

    if (!usuario) {
      return {
        ok: false,
        status: 404,
        message: 'Usuario no encontrado',
      };
    }

    const sql = `
      SELECT id_solicitud, rut_cliente, monto_cliente, estado, cant_cuotas
      FROM solicitud_prestamo
      WHERE id_solicitud = $1
        AND rut_cliente = $2
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idSolicitud, rut]);

    if (rows.length === 0) {
      return {
        ok: false,
        status: 404,
        message: 'Solicitud no encontrada para este usuario',
      };
    }

    return {
      ok: true,
      solicitud: rows[0],
    };
  }

  async create({ rut, idSolicitud, riesgo }) {
    const validacion = await this.validarSolicitudDelUsuario({ rut, idSolicitud });

    if (!validacion.ok) {
      return validacion;
    }

    const sql = `
      INSERT INTO evaluacion (id_solicitud, riesgo)
      VALUES ($1, $2)
      RETURNING
        id_evaluacion AS "idEvaluacion",
        id_solicitud AS "idSolicitud",
        riesgo
    `;

    const { rows } = await this.query(sql, [idSolicitud, riesgo]);

    return {
      ok: true,
      evaluacion: rows[0] ?? null,
    };
  }

  async update({ rut, idEvaluacion, riesgo }) {
    const evaluacionActual = await this.findById(idEvaluacion);

    if (!evaluacionActual) {
      return {
        ok: false,
        status: 404,
        message: 'Evaluación no encontrada',
      };
    }

    const validacion = await this.validarSolicitudDelUsuario({
      rut,
      idSolicitud: evaluacionActual.idSolicitud,
    });

    if (!validacion.ok) {
      return validacion;
    }

    const sql = `
      UPDATE evaluacion
      SET riesgo = $1
      WHERE id_evaluacion = $2
      RETURNING
        id_evaluacion AS "idEvaluacion",
        id_solicitud AS "idSolicitud",
        riesgo
    `;

    const { rows } = await this.query(sql, [riesgo, idEvaluacion]);

    return {
      ok: true,
      evaluacion: rows[0] ?? null,
    };
  }

  async delete({ rut, idEvaluacion }) {
    const evaluacionActual = await this.findById(idEvaluacion);

    if (!evaluacionActual) {
      return {
        ok: false,
        status: 404,
        message: 'Evaluación no encontrada',
      };
    }

    const validacion = await this.validarSolicitudDelUsuario({
      rut,
      idSolicitud: evaluacionActual.idSolicitud,
    });

    if (!validacion.ok) {
      return validacion;
    }

    const sql = `
      DELETE FROM evaluacion
      WHERE id_evaluacion = $1
      RETURNING id_evaluacion AS "idEvaluacion"
    `;

    const { rows } = await this.query(sql, [idEvaluacion]);

    return {
      ok: rows.length > 0,
      deleted: rows[0] ?? null,
    };
  }

  async findById(idEvaluacion) {
    const sql = `
      SELECT
        e.id_evaluacion AS "idEvaluacion",
        e.id_solicitud AS "idSolicitud",
        s.rut_cliente AS rut,
        e.riesgo,
        s.monto_cliente AS monto,
        s.estado,
        s.cant_cuotas AS "cantCuotas",
        s.fecha_solicitud AS "fechaSolicitud"
      FROM evaluacion e
      INNER JOIN solicitud_prestamo s
        ON s.id_solicitud = e.id_solicitud
      WHERE e.id_evaluacion = $1
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idEvaluacion]);
    return rows[0] ?? null;
  }

  async findBySolicitud({ rut, idSolicitud }) {
    const sql = `
      SELECT
        e.id_evaluacion AS "idEvaluacion",
        e.id_solicitud AS "idSolicitud",
        s.rut_cliente AS rut,
        e.riesgo,
        s.monto_cliente AS monto,
        s.estado,
        s.cant_cuotas AS "cantCuotas",
        s.fecha_solicitud AS "fechaSolicitud"
      FROM evaluacion e
      INNER JOIN solicitud_prestamo s
        ON s.id_solicitud = e.id_solicitud
      WHERE e.id_solicitud = $1
        AND s.rut_cliente = $2
      LIMIT 1
    `;

    const { rows } = await this.query(sql, [idSolicitud, rut]);
    return rows[0] ?? null;
  }

  async findAllByRut(rut) {
    const sql = `
      SELECT
        e.id_evaluacion AS "idEvaluacion",
        e.id_solicitud AS "idSolicitud",
        s.rut_cliente AS rut,
        e.riesgo,
        s.monto_cliente AS monto,
        s.estado,
        s.cant_cuotas AS "cantCuotas",
        s.fecha_solicitud AS "fechaSolicitud"
      FROM evaluacion e
      INNER JOIN solicitud_prestamo s
        ON s.id_solicitud = e.id_solicitud
      WHERE s.rut_cliente = $1
      ORDER BY s.fecha_solicitud DESC, e.id_evaluacion DESC
    `;

    const { rows } = await this.query(sql, [rut]);
    return rows;
  }

  calcularRiesgo({ sueldo, monto, cantCuotas }) {
    const sueldoNum = Number(sueldo);
    const montoNum = Number(monto);
    const cuotasNum = Number(cantCuotas);

    if (!Number.isFinite(sueldoNum) || sueldoNum <= 0) {
      throw new Error('Sueldo inválido para calcular riesgo');
    }

    if (!Number.isFinite(montoNum) || montoNum <= 0) {
      throw new Error('Monto inválido para calcular riesgo');
    }

    if (!Number.isFinite(cuotasNum) || cuotasNum <= 0) {
      throw new Error('Cantidad de cuotas inválida para calcular riesgo');
    }

    const cuotaEstimada = montoNum / cuotasNum;
    const cargaMensual = cuotaEstimada / sueldoNum;

    if (cargaMensual <= 0.25) return 1;
    if (cargaMensual <= 0.40) return 2;
    return 3;
  }

  async evaluarYGuardar({ rut, idSolicitud, sueldo }) {
    const validacion = await this.validarSolicitudDelUsuario({ rut, idSolicitud });

    if (!validacion.ok) {
      return validacion;
    }

    const riesgo = this.calcularRiesgo({
      sueldo,
      monto: validacion.solicitud.monto_cliente,
      cantCuotas: validacion.solicitud.cant_cuotas,
    });

    return this.create({ rut, idSolicitud, riesgo });
  }
}

export const evaluacionModel = new EvaluacionModel();