// Modelo/EvaluacionModel.js
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
      SELECT
        id_solicitud AS "idSolicitud",
        rut_cliente AS rut,
        monto_cliente AS monto,
        sueldo_cliente AS sueldo,
        estado,
        cant_cuotas AS "cantCuotas",
        fecha_solicitud AS "fechaSolicitud"
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

  cuotaConTasa(monto, cuotas, tasaAnual) {
    const i = tasaAnual / 100 / 12;

    if (i === 0) {
      return monto / cuotas;
    }

    return monto * i / (1 - Math.pow(1 + i, -cuotas));
  }

  calcularTasaOfrecida({ monto, sueldo, cantCuotas }) {
    const tasaBase = 18;
    const cuotaPre = this.cuotaConTasa(monto, cantCuotas, tasaBase);
    const carga = sueldo > 0 ? cuotaPre / sueldo : 1e9;

    let tasa;

    if (carga <= 0.25) tasa = 14;
    else if (carga <= 0.35) tasa = 18;
    else if (carga <= 0.45) tasa = 24;
    else tasa = 32;

    if (cantCuotas > 36 && cantCuotas <= 48) tasa += 2;
    else if (cantCuotas > 48) tasa += 4;

    if (monto >= 5_000_000) tasa -= 1;
    if (monto < 500_000) tasa += 1.5;

    if (tasa < 8) tasa = 8;
    if (tasa > 39) tasa = 39;

    const cuota = this.cuotaConTasa(monto, cantCuotas, tasa);
    const total = cuota * cantCuotas;
    const intereses = total - monto;
    const cargaFinal = sueldo > 0 ? (cuota / sueldo) * 100 : 100;

    return {
      tasaAnual: Number(tasa.toFixed(2)),
      cuota,
      total,
      intereses,
      carga: cargaFinal,
    };
  }

  riesgoDesdeCarga({ carga, monto, cantCuotas }) {
    let riesgo;

    if (carga <= 20) riesgo = 1;
    else if (carga <= 25) riesgo = 2;
    else if (carga <= 30) riesgo = 3;
    else if (carga <= 35) riesgo = 4;
    else if (carga <= 40) riesgo = 5;
    else if (carga <= 45) riesgo = 6;
    else if (carga <= 50) riesgo = 7;
    else if (carga <= 55) riesgo = 8;
    else if (carga <= 60) riesgo = 9;
    else riesgo = 10;

    if (cantCuotas > 60 && riesgo < 10) riesgo += 1;
    if (monto > 10_000_000 && riesgo < 10) riesgo += 1;

    return Math.min(10, Math.max(1, riesgo));
  }

  estadoDesdeRiesgo({ riesgo, monto, cantCuotas }) {
    if (riesgo <= 4) {
      return {
        estado: 'aceptada',
        motivo: 'riesgo menor o igual a 4',
      };
    }

    if (riesgo === 5 && monto <= 5_000_000 && cantCuotas <= 48) {
      return {
        estado: 'aceptada',
        motivo: 'riesgo 5 con monto y plazo moderados',
      };
    }

    return {
      estado: 'rechazada',
      motivo: 'riesgo alto',
    };
  }

  async guardarRiesgo({ idSolicitud, riesgo }) {
    const buscarSql = `
      SELECT id_evaluacion
      FROM evaluacion
      WHERE id_solicitud = $1
      LIMIT 1
    `;

    const existente = await this.query(buscarSql, [idSolicitud]);

    if (existente.rows.length > 0) {
      const updateSql = `
        UPDATE evaluacion
        SET riesgo = $1,
            updated_at = now()
        WHERE id_solicitud = $2
        RETURNING
          id_evaluacion AS "idEvaluacion",
          id_solicitud AS "idSolicitud",
          riesgo
      `;

      const { rows } = await this.query(updateSql, [riesgo, idSolicitud]);
      return rows[0] ?? null;
    }

    const insertSql = `
      INSERT INTO evaluacion (id_solicitud, riesgo)
      VALUES ($1, $2)
      RETURNING
        id_evaluacion AS "idEvaluacion",
        id_solicitud AS "idSolicitud",
        riesgo
    `;

    const { rows } = await this.query(insertSql, [idSolicitud, riesgo]);
    return rows[0] ?? null;
  }

  async evaluarSolicitud({ rut, idSolicitud }) {
    const validacion = await this.validarSolicitudDelUsuario({ rut, idSolicitud });

    if (!validacion.ok) {
      return validacion;
    }

    const solicitud = validacion.solicitud;

    const monto = Number(solicitud.monto);
    const sueldo = Number(solicitud.sueldo);
    const cantCuotas = Number(solicitud.cantCuotas);

    if (!Number.isFinite(monto) || monto <= 0) {
      return {
        ok: false,
        status: 400,
        message: 'Monto inválido',
      };
    }

    if (!Number.isFinite(sueldo) || sueldo <= 0) {
      return {
        ok: false,
        status: 400,
        message: 'Sueldo inválido',
      };
    }

    if (!Number.isFinite(cantCuotas) || cantCuotas <= 0) {
      return {
        ok: false,
        status: 400,
        message: 'Cantidad de cuotas inválida',
      };
    }

    const oferta = this.calcularTasaOfrecida({
      monto,
      sueldo,
      cantCuotas,
    });

    const cargaPorc = Number(oferta.carga.toFixed(1));

    const riesgo = this.riesgoDesdeCarga({
      carga: cargaPorc,
      monto,
      cantCuotas,
    });

    const decision = this.estadoDesdeRiesgo({
      riesgo,
      monto,
      cantCuotas,
    });

    const evaluacion = await this.guardarRiesgo({
      idSolicitud,
      riesgo,
    });

    const updateSolicitudSql = `
      UPDATE solicitud_prestamo
      SET estado = $1,
          updated_at = now()
      WHERE id_solicitud = $2
        AND rut_cliente = $3
      RETURNING
        id_solicitud AS "idSolicitud",
        rut_cliente AS rut,
        monto_cliente AS monto,
        sueldo_cliente AS sueldo,
        estado,
        cant_cuotas AS "cantCuotas",
        fecha_solicitud AS "fechaSolicitud"
    `;

    const { rows } = await this.query(updateSolicitudSql, [
      decision.estado,
      idSolicitud,
      rut,
    ]);

    return {
      ok: true,
      solicitud: rows[0] ?? solicitud,
      evaluacion,
      riesgo,
      estado: decision.estado,
      motivo: decision.motivo,
      tasa: oferta.tasaAnual,
      cuotaEstimada: Math.round(oferta.cuota),
      carga: cargaPorc,
    };
  }

  async findAllByRut(rut) {
  const sql = `
    SELECT
      s.id_solicitud AS "idSolicitud",
      s.rut_cliente AS rut,
      s.monto_cliente AS monto,
      s.sueldo_cliente AS sueldo,
      s.estado,
      s.cant_cuotas AS "cantCuotas",
      s.fecha_solicitud AS "fechaSolicitud",
      e.id_evaluacion AS "idEvaluacion",
      e.riesgo
    FROM solicitud_prestamo s
    LEFT JOIN evaluacion e
      ON e.id_solicitud = s.id_solicitud
    WHERE s.rut_cliente = $1
    ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC
  `;

  const { rows } = await this.query(sql, [rut]);
  return rows;
}

  async findEstadoBySolicitud({ rut, idSolicitud }) {
  const sql = `
    SELECT
      s.id_solicitud AS "idSolicitud",
      s.rut_cliente AS rut,
      s.monto_cliente AS monto,
      s.sueldo_cliente AS sueldo,
      s.estado,
      s.cant_cuotas AS "cantCuotas",
      s.fecha_solicitud AS "fechaSolicitud",
      e.id_evaluacion AS "idEvaluacion",
      e.riesgo
    FROM solicitud_prestamo s
    LEFT JOIN evaluacion e
      ON e.id_solicitud = s.id_solicitud
    WHERE s.rut_cliente = $1
      AND s.id_solicitud = $2
    LIMIT 1
  `;

  const { rows } = await this.query(sql, [rut, idSolicitud]);
  return rows[0] ?? null;
}
}

export const evaluacionModel = new EvaluacionModel();