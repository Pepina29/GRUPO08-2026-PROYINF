import { Router } from "express";
import userController from "../Controlador/UserController.js";

const router = Router();

router.get("/datos-solicitud", userController.datosSolicitud);

export default router;