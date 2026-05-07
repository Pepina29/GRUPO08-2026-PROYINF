import { userModel } from '../models/index.js';
import { formatearRut, validarRutJs } from '../utils/rut.js';

class AuthController {
  constructor(model = userModel) {
    this.userModel = model;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  /**
   * POST /api/register
   * body: { rut, nombre, apellido, email, password }
   */
  async register(req, res) {
    const { rut, nombre, apellido, email, password } = req.body || {};
    console.log('>>> RUT recibido desde frontend:', rut);

    if (!rut || !nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    console.log('>>> validarRutJs(21550326-7) =', validarRutJs('21550326-7'));

    if (!validarRutJs(rut)) {
      return res.status(400).json({
        error: 'RUT inválido (formato o dígito verificador incorrecto)',
      });
    }

    const rutFormateado = formatearRut(rut);

    try {
      const user = await this.userModel.create({
        rut: rutFormateado,
        nombre,
        apellido,
        email,
        password,
      });

      return res.status(201).json({ user });
    } catch (e) {
      if (e.code === '23505') {
        return res.status(409).json({ error: 'RUT o email ya registrado' });
      }

      if (String(e.message || '').includes('RUT_INVALIDO')) {
        return res.status(400).json({ error: 'Dígito verificador incorrecto' });
      }

      console.error('[register]', e);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/login
   */
  async login(req, res) {
    const { rut, password } = req.body || {};

    if (!rut) return res.status(400).json({ error: 'Falta RUT' });
    if (!password) return res.status(400).json({ error: 'Falta contraseña' });

    if (!validarRutJs(rut)) {
      return res.status(400).json({ error: 'RUT inválido (formato o DV)' });
    }

    const rutFormateado = formatearRut(rut);

    try {
      const user = await this.userModel.findByRut(rutFormateado, {
        includePassword: true,
      });

      if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

      if (user.contrasena !== password) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      delete user.contrasena;

      return res.json({ user });
    } catch (e) {
      console.error('[login]', e);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}

export default new AuthController();
