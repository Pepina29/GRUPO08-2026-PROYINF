import { userModel } from "../Modelo/UserModel.js";

class UserController {
  async datosSolicitud(req, res) {
    try {
      console.log("SESSION DATOS SOLICITUD:", req.session);

      const rut =
        req.session?.loanUser?.rut ||
        req.session?.user?.rut ||
        req.session?.user?.rut_cliente;

      if (!rut) {
        return res.status(401).json({
          ok: false,
          message: "No hay sesión iniciada",
        });
      }

      const user = await userModel.getDatosSolicitudByRut(rut);

      if (!user) {
        return res.status(404).json({
          ok: false,
          message: "Usuario no encontrado",
        });
      }

      return res.json({
        ok: true,
        user,
      });
    } catch (error) {
      console.error("Error obteniendo datos de solicitud:", error);
      return res.status(500).json({
        ok: false,
        message: "Error interno del servidor",
      });
    }
  }
}

export default new UserController();