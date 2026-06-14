// Backend/Rutas/prestamoRoutes.js
import express from "express";
import PrestamoController from "../Controlador/PrestamoController.js";

const router = express.Router();
const prestamoController = new PrestamoController();

router.post("/confirmar", prestamoController.confirmarPrestamo);
router.get("/", prestamoController.listarMisPrestamos);
router.get("/solicitud/:idSolicitud", prestamoController.obtenerPorSolicitud);

export default router;