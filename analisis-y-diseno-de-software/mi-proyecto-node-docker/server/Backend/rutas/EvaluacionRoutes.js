// Rutas/EvaluacionRoutes.js
import express from 'express';
import evaluacionController from '../Controlador/EvaluacionController.js';

const router = express.Router();

router.get('/historial', evaluacionController.historial);
router.get('/solicitud/:idSolicitud', evaluacionController.estadoPorSolicitud);

export default router;