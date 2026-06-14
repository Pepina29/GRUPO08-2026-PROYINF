// Controlador/SolicitudPrestamoController.js
import { solicitudPrestamoModel } from '../Modelo/SolicitudPrestamoModel.js';
import { evaluacionModel } from '../Modelo/EvaluacionModel.js';

class SolicitudPrestamoController {
  async crear(req, res) {
    try {
      const rut =
        req.session?.user?.rut ||
        req.session?.user?.rut_cliente ||
        req.session?.loanUser?.rut ||
        req.session?.loanUser?.rut_cliente ||
        req.body?.rut;

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: 'No hay usuario autenticado',
        });
      }

      const { monto, sueldo, cantCuotas, cuotas } = req.body;

      const montoNum = Number(monto);
      const sueldoNum = Number(sueldo);
      const cantCuotasNum = Number(cantCuotas ?? cuotas);

      if (!Number.isFinite(montoNum) || montoNum <= 0) {
        return res.status(400).json({
          ok: false,
          message: 'Monto inválido',
        });
      }

      if (!Number.isFinite(sueldoNum) || sueldoNum <= 0) {
        return res.status(400).json({
          ok: false,
          message: 'Sueldo inválido',
        });
      }

      if (!Number.isFinite(cantCuotasNum) || cantCuotasNum <= 0) {
        return res.status(400).json({
          ok: false,
          message: 'Cantidad de cuotas inválida',
        });
      }

      const solicitud = await solicitudPrestamoModel.create({
        rut,
        monto: montoNum,
        sueldo: sueldoNum,
        cantCuotas: cantCuotasNum,
        estado: 'pendiente',
      });

      const evaluacion = await evaluacionModel.evaluarSolicitud({
        rut,
        idSolicitud: solicitud.idSolicitud,
      });

      if (!evaluacion.ok) {
        return res.status(evaluacion.status ?? 400).json(evaluacion);
      }

      return res.status(201).json({
        ok: true,
        message: 'Solicitud creada y evaluada correctamente',
        solicitud: evaluacion.solicitud,
        evaluacion: evaluacion.evaluacion,
        riesgo: evaluacion.riesgo,
        estado: evaluacion.estado,
        motivo: evaluacion.motivo,
        tasa: evaluacion.tasa,
        cuotaEstimada: evaluacion.cuotaEstimada,
        carga: evaluacion.carga,
      });
    } catch (error) {
      console.error('Error creando solicitud de préstamo:', error);

      return res.status(500).json({
        ok: false,
        message: 'Error interno creando solicitud',
      });
    }
  }

  async listar(req, res) {
    try {
      const rut =
        req.session?.user?.rut ||
        req.session?.user?.rut_cliente;

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: 'No hay usuario autenticado',
        });
      }

      const solicitudes = await solicitudPrestamoModel.findAllByRut(rut);

      return res.json({
        ok: true,
        solicitudes,
      });
    } catch (error) {
      console.error('Error listando solicitudes:', error);

      return res.status(500).json({
        ok: false,
        message: 'Error interno listando solicitudes',
      });
    }
  }
}

export default new SolicitudPrestamoController();