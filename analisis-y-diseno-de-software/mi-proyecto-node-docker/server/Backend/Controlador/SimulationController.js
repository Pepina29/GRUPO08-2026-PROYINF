import { simulationModel } from '../Modelo/SimulationModel.js';
import { formatearRut, validarRutJs } from '../utils/rut.js';

class SimulationController {
  constructor(model = simulationModel) {
    this.simulationModel = model;

    this.findByRut = this.findByRut.bind(this);
    this.countByRut = this.countByRut.bind(this);
    this.create = this.create.bind(this);
    this.deleteById = this.deleteById.bind(this);
    this.deleteAllByRut = this.deleteAllByRut.bind(this);
  }

  async findByRut(req, res) {
    const rut = req.query.rut;
    if (!rut) return res.status(400).json({ error: 'Falta rut' });

    const rutFmt = formatearRut(rut);
    if (!validarRutJs(rutFmt)) {
      return res.status(400).json({ error: 'RUT inválido' });
    }

    try {
      const simulations = await this.simulationModel.findByRut(rutFmt);
      return res.json({ simulations });
    } catch (e) {
      console.error('[GET /simulations]', e);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /** GET /api/simulations/count?rut=12.345.678-9 */
  async countByRut(req, res) {
    const rut = req.query.rut;
    if (!rut) return res.status(400).json({ error: 'Falta rut' });

    try {
      const count = await this.simulationModel.countByRut(rut);
      return res.json({ count });
    } catch (e) {
      console.error('[GET /simulations/count]', e);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /** POST /api/simulations body: { rut, data } */
  async create(req, res) {
    const { rut, data } = req.body || {};
    if (!rut || !data) return res.status(400).json({ error: 'Faltan datos' });

    try {
      const simulation = await this.simulationModel.create({ rut, data });
      return res.status(201).json({ simulation });
    } catch (e) {
      if (String(e.message || '').includes('SIM_LIMIT_REACHED')) {
        return res.status(409).json({ error: 'limit' });
      }

      console.error('[POST /simulations]', e);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /** DELETE /api/simulations/:id?rut=12.345.678-9 */
  async deleteById(req, res) {
    const rut = req.query.rut;
    const { id } = req.params;
    if (!rut || !id) return res.status(400).json({ error: 'Falta rut o id' });

    try {
      const deleted = await this.simulationModel.deleteByIdAndRut({ id, rut });
      if (!deleted) return res.status(404).json({ error: 'No encontrada' });
      return res.json({ ok: true });
    } catch (e) {
      console.error('[DELETE /simulations/:id]', e);
      return res.status(500).json({ error: 'Error interno' });
    }
  }

  /** DELETE /api/simulations?rut=12.345.678-9  (todas) */
  async deleteAllByRut(req, res) {
    const rut = req.query.rut;
    if (!rut) return res.status(400).json({ error: 'Falta rut' });

    try {
      await this.simulationModel.deleteAllByRut(rut);
      return res.json({ ok: true });
    } catch (e) {
      console.error('[DELETE /simulations]', e);
      return res.status(500).json({ error: 'Error interno' });
    }
  }
}

export default new SimulationController();
