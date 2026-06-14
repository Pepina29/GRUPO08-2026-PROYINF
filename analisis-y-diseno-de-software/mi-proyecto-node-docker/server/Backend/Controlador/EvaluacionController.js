// Controlador/EvaluacionController.js
import { evaluacionModel } from '../Modelo/EvaluacionModel.js';

function obtenerRutDesdeRequest(req) {
  return (
    req.session?.user?.rut ||
    req.session?.user?.rut_cliente ||
    req.session?.loanUser?.rut ||
    req.session?.loanUser?.rut_cliente ||
    null
  );
}

class EvaluacionController {
  async historial(req, res) {
    try {
      console.log('SESSION HISTORIAL EVALUACION:', req.session);

      const rut = obtenerRutDesdeRequest(req);

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: 'No hay usuario autenticado',
        });
      }

      const solicitudes = await evaluacionModel.findAllByRut(rut);

      return res.json({
        ok: true,
        solicitudes,
      });
    } catch (error) {
      console.error('Error obteniendo historial de evaluaciones:', error);

      return res.status(500).json({
        ok: false,
        message: 'Error interno obteniendo historial',
      });
    }
  }

  async estadoPorSolicitud(req, res) {
    try {
      const rut = obtenerRutDesdeRequest(req);
      const { idSolicitud } = req.params;

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: 'No hay usuario autenticado',
        });
      }

      const solicitud = await evaluacionModel.findEstadoBySolicitud({
        rut,
        idSolicitud,
      });

      if (!solicitud) {
        return res.status(404).json({
          ok: false,
          message: 'Solicitud no encontrada',
        });
      }

      return res.json({
        ok: true,
        solicitud,
      });
    } catch (error) {
      console.error('Error obteniendo estado de solicitud:', error);

      return res.status(500).json({
        ok: false,
        message: 'Error interno obteniendo estado',
      });
    }
  }
}

export default new EvaluacionController();