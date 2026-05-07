import { Router } from 'express';
import simulationController from '../Controlador/SimulationController.js';

const router = Router();

router.get('/', simulationController.findByRut);
router.get('/count', simulationController.countByRut);
router.post('/', simulationController.create);
router.delete('/:id', simulationController.deleteById);
router.delete('/', simulationController.deleteAllByRut);

export default router;
