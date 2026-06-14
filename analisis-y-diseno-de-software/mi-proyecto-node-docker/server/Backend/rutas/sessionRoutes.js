import { Router } from "express";
import { userModel } from "../Modelo/UserModel.js";
import { formatearRut, validarRutJs } from "../utils/rut.js";

const router = Router();

router.post("/loan-user", async (req, res) => {
  try {
    const { rut } = req.body || {};

    if (!rut) {
      return res.status(400).json({
        ok: false,
        message: "Falta RUT para iniciar sesión de solicitud",
      });
    }

    const rutFormateado = formatearRut(String(rut));

    if (!validarRutJs(rutFormateado)) {
      return res.status(400).json({
        ok: false,
        message: "RUT inválido",
      });
    }

    const user = await userModel.getDatosSolicitudByRut(rutFormateado);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "Usuario no encontrado",
      });
    }

    req.session.loanUser = {
      rut: user.rut,
    };

    req.session.save((err) => {
      if (err) {
        console.error("Error guardando sesión de solicitud:", err);

        return res.status(500).json({
          ok: false,
          message: "Error guardando sesión",
        });
      }

      return res.json({
        ok: true,
        message: "Sesión de solicitud creada",
      });
    });
  } catch (error) {
    console.error("Error creando sesión de solicitud:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno creando sesión de solicitud",
    });
  }
});

export default router;