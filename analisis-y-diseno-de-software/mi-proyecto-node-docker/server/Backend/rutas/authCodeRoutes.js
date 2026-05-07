import { Router } from "express";
import AuthCodeController from "../Controlador/AuthCodeController.js";

const router = Router();

router.post("/", AuthCodeController.guardar);
router.get("/status", AuthCodeController.status);
router.post("/verify", AuthCodeController.verificar);

export default router;