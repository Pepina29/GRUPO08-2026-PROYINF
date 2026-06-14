// Rutas/SolicitudPrestamoRoutes.js
import express from 'express';
import solicitudPrestamoController from '../Controlador/SolicitudPrestamoController.js';

const router = express.Router();

router.post('/', solicitudPrestamoController.crear);
router.get('/', solicitudPrestamoController.listar);

export default router;