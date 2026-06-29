import UserModel from "../Modelo/UserModel.js";

const userModel = new UserModel();

function getRutFromRequest(req) {
  return (
    req.session?.user?.rut ||
    req.session?.user?.rut_cliente ||
    req.user?.rut ||
    req.user?.rut_cliente ||
    req.body?.rut ||
    req.query?.rut
  );
}

class AuthCodeController {
  async guardar(req, res) {
    try {
      // Log general sin exponer datos enviados por el usuario
      console.log("Solicitud de guardado de código autenticador recibida");

      const { code } = req.body;
      const rut = getRutFromRequest(req);

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: "No hay usuario autenticado",
        });
      }

      if (!code || !/^\d{6}$/.test(String(code))) {
        return res.status(400).json({
          ok: false,
          message: "El código debe tener exactamente 6 dígitos",
        });
      }

      const usuarioActualizado = await userModel.guardarAutenticador(rut, code);

      if (!usuarioActualizado) {
        return res.status(404).json({
          ok: false,
          message: "Usuario no encontrado",
        });
      }

      return res.json({
        ok: true,
        message: "Código autenticador guardado correctamente",
      });
    } catch (error) {
      console.error("Error guardando código autenticador:", error);

      return res.status(500).json({
        ok: false,
        message: "Error interno al guardar el código autenticador",
      });
    }
  }

  async status(req, res) {
    try {
      const rut = getRutFromRequest(req);

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: "No hay usuario autenticado",
        });
      }

      const hasAuthCode = await userModel.tieneAutenticador(rut);

      return res.json({
        ok: true,
        hasAuthCode,
      });
    } catch (error) {
      console.error("Error revisando código autenticador:", error);

      return res.status(500).json({
        ok: false,
        message: "Error interno al revisar el código autenticador",
      });
    }
  }

  async verificar(req, res) {
    try {
      const { rut: rutBody, code, autenticador } = req.body;

      const rut =
        req.session?.user?.rut ||
        req.session?.user?.rut_cliente ||
        req.session?.loanUser?.rut ||
        req.session?.loanUser?.rut_cliente ||
        req.user?.rut ||
        req.user?.rut_cliente ||
        rutBody;

      const codigo = code || autenticador;

      if (!rut) {
        return res.status(401).json({
          ok: false,
          valid: false,
          message: "No hay usuario autenticado",
        });
      }

      if (!codigo || !/^\d{6}$/.test(String(codigo))) {
        return res.status(400).json({
          ok: false,
          valid: false,
          message: "El código debe tener exactamente 6 dígitos",
        });
      }

      const codigoNormalizado = String(codigo).padStart(6, "0");

      const esValido = await userModel.verificarAutenticador(
        rut,
        codigoNormalizado
      );

      if (!esValido) {
        return res.status(401).json({
          ok: false,
          valid: false,
          message: "Código incorrecto",
        });
      }

      return res.json({
        ok: true,
        valid: true,
        message: "Código verificado correctamente",
      });
    } catch (error) {
      console.error("Error verificando autenticador:", error);

      return res.status(500).json({
        ok: false,
        valid: false,
        message: "Error interno verificando el código",
      });
    }
  }
}

export default new AuthCodeController();