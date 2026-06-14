// Backend/Controlador/PrestamoController.js
import PrestamoModel from "../Modelo/PrestamoModel.js";
import SolicitudPrestamoModel from "../Modelo/SolicitudPrestamoModel.js";
import UserModel from "../Modelo/UserModel.js";

const prestamoModel = new PrestamoModel();
const solicitudPrestamoModel = new SolicitudPrestamoModel();
const userModel = new UserModel();

function obtenerRutSesion(req) {
  return (
    req.session?.user?.rut ||
    req.session?.user?.rut_cliente ||
    req.session?.user?.rutCliente ||
    req.user?.rut ||
    req.user?.rut_cliente ||
    req.user?.rutCliente ||
    req.body?.rut ||
    req.body?.rut_cliente ||
    req.body?.rutCliente ||
    req.query?.rut ||
    req.query?.rut_cliente ||
    req.query?.rutCliente
  );
}

function normalizarEstado(estado) {
  return String(estado || "").toLowerCase().trim();
}

function estadoPermiteFirmar(estado) {
  const estadoNormalizado = normalizarEstado(estado);

  return [
    "aceptada",
    "aceptado",
    "aprobada",
    "aprobado",
  ].includes(estadoNormalizado);
}

function estadoYaPedido(estado) {
  const estadoNormalizado = normalizarEstado(estado);

  return [
    "pedido",
    "pedida",
    "prestamo pedido",
    "préstamo pedido",
    "solicitado",
    "solicitada",
  ].includes(estadoNormalizado);
}

export default class PrestamoController {
  async confirmarPrestamo(req, res) {
    try {
      const rutCliente = obtenerRutSesion(req);
      const { id_solicitud, idSolicitud, codigo, autenticador } = req.body;

      const solicitudId = id_solicitud || idSolicitud;
      const codigoIngresado = codigo || autenticador;

      if (!rutCliente) {
        return res.status(401).json({
          ok: false,
          message: "No hay usuario autenticado",
        });
      }

      if (!solicitudId) {
        return res.status(400).json({
          ok: false,
          message: "Falta el id de la solicitud",
        });
      }

      if (!codigoIngresado || !/^\d{6}$/.test(String(codigoIngresado))) {
        return res.status(400).json({
          ok: false,
          message: "El código debe tener exactamente 6 dígitos",
        });
      }

      const codigoValido = await userModel.verificarAutenticador(
        rutCliente,
        codigoIngresado
      );

      if (!codigoValido) {
        return res.status(401).json({
          ok: false,
          message: "Código de autenticación incorrecto",
        });
      }

      const solicitud = await solicitudPrestamoModel.findByIdAndRut(
        solicitudId,
        rutCliente
      );

      if (!solicitud) {
        return res.status(404).json({
          ok: false,
          message: "No se encontró la solicitud para este usuario",
        });
      }

      if (estadoYaPedido(solicitud.estado)) {
        return res.status(409).json({
          ok: false,
          message: "Esta solicitud ya fue firmada y el préstamo ya fue pedido",
        });
      }

      if (!estadoPermiteFirmar(solicitud.estado)) {
        return res.status(400).json({
          ok: false,
          message: "Solo se pueden firmar solicitudes aceptadas",
        });
      }

      const prestamoExistente = await prestamoModel.findByIdSolicitudAndRut
        ? await prestamoModel.findByIdSolicitudAndRut(solicitudId, rutCliente)
        : await prestamoModel.findByIdSolicitud(solicitudId);

      if (prestamoExistente) {
        const solicitudActualizada =
          await solicitudPrestamoModel.marcarComoPedido(
            solicitudId,
            rutCliente
          );

        return res.status(200).json({
          ok: true,
          message: "El préstamo ya existía, la solicitud fue marcada como pedido",
          prestamo: prestamoExistente,
          solicitud: solicitudActualizada || {
            ...solicitud,
            estado: "pedido",
          },
        });
      }

      const plazo =
        solicitud.cantidadCuotas ||
        solicitud.cantCuotas ||
        solicitud.cant_cuotas ||
        solicitud.cantidad_cuotas ||
        solicitud.plazo ||
        solicitud.cuotas;

      if (!plazo) {
        return res.status(400).json({
          ok: false,
          message: "La solicitud no tiene cantidad de cuotas/plazo válido",
        });
      }

      if (!solicitud.monto) {
        return res.status(400).json({
          ok: false,
          message: "La solicitud no tiene monto válido",
        });
      }

      const prestamo = await prestamoModel.crear({
        idSolicitud: solicitud.idSolicitud,
        monto: solicitud.monto,
        plazo,
        tasa: 0.02,
        estado: "activo",
      });

      const solicitudActualizada =
        await solicitudPrestamoModel.marcarComoPedido(
          solicitud.idSolicitud,
          rutCliente
        );

      return res.status(201).json({
        ok: true,
        message: "Préstamo creado correctamente",
        prestamo,
        solicitud: solicitudActualizada || {
          ...solicitud,
          estado: "pedido",
        },
      });
    } catch (error) {
      console.error("Error al confirmar préstamo:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          ok: false,
          message: "Ya existe un préstamo asociado a esta solicitud",
        });
      }

      return res.status(500).json({
        ok: false,
        message: "Error interno al confirmar el préstamo",
      });
    }
  }

  async obtenerPorSolicitud(req, res) {
    try {
      const rutCliente = obtenerRutSesion(req);
      const { idSolicitud } = req.params;

      if (!rutCliente) {
        return res.status(401).json({
          ok: false,
          message: "No hay usuario autenticado",
        });
      }

      const solicitud = await solicitudPrestamoModel.findByIdAndRut(
        idSolicitud,
        rutCliente
      );

      if (!solicitud) {
        return res.status(404).json({
          ok: false,
          message: "No se encontró la solicitud para este usuario",
        });
      }

      const prestamo = await prestamoModel.findByIdSolicitudAndRut
        ? await prestamoModel.findByIdSolicitudAndRut(idSolicitud, rutCliente)
        : await prestamoModel.findByIdSolicitud(idSolicitud);

      return res.json({
        ok: true,
        prestamo,
      });
    } catch (error) {
      console.error("Error al obtener préstamo por solicitud:", error);

      return res.status(500).json({
        ok: false,
        message: "Error interno al obtener el préstamo",
      });
    }
  }

  async listarMisPrestamos(req, res) {
    try {
      const rutCliente = obtenerRutSesion(req);

      if (!rutCliente) {
        return res.status(401).json({
          ok: false,
          message: "No hay usuario autenticado",
        });
      }

      const prestamos = await prestamoModel.findByRutCliente(rutCliente);

      return res.json({
        ok: true,
        prestamos,
      });
    } catch (error) {
      console.error("Error al listar préstamos:", error);

      return res.status(500).json({
        ok: false,
        message: "Error interno al listar préstamos",
      });
    }
  }
}