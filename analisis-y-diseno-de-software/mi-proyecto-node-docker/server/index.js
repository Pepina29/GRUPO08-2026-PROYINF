// server/index.js
// import express from 'express';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import cors from 'cors';
// import authRoutes from './routes/auth.js';
// import simulationRoutes from './routes/simulations.js';
// import documentRoutes from './routes/documents.js'; // <-- NUEVO: Importamos las rutas de documentos

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const app = express();

// // CORS
// app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
// app.use(express.json());

// // API
// app.use('/api', authRoutes);
// app.get('/api/health', (_req, res) => res.json({ ok: true }));
// app.use('/api/simulations', simulationRoutes);
// app.use('/api', documentRoutes); // <-- NUEVO: Conectamos la ruta (/api/upload-docs)

// // Static del front
// app.use(express.static(path.join(__dirname, '../client/dist')));

// // Fallback SPA: cualquier ruta que NO empiece con /api -> index.html
// app.get(/^(?!\/api).*/, (_req, res) => {
//   res.sendFile(path.join(__dirname, '../client/dist/index.html'));
// });

// // (opcional) 404 para rutas API no encontradas
// app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Servidor escuchando en puerto ${PORT}`));

//arriba viejo

// server/index.js
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import authRoutes from './Backend/rutas/auth.js';
import simulationRoutes from './Backend/rutas/simulations.js';
import documentRoutes from './Backend/rutas/documents.js';
import authCodeRoutes from "./Backend/rutas/authCodeRoutes.js";
import userRoutes from "./Backend/rutas/userRoutes.js";
import session from "express-session";
import sessionRoutes from "./Backend/rutas/sessionRoutes.js";
import solicitudPrestamoRoutes from './Backend/rutas/SolicitudPrestamoRoutes.js';
import evaluacionRoutes from './Backend/rutas/EvaluacionRoutes.js';
import prestamoRoutes from "./Backend/rutas/prestamoRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares globales
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-sistema-prestamos",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60,
  },
}));

// API
app.use('/api', authRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/simulations', simulationRoutes);
app.use('/api', documentRoutes);
app.use('/api/auth-code', authCodeRoutes);
app.use("/api/auth-code/verify", authCodeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/session", sessionRoutes);
app.use('/api/solicitudes-prestamo', solicitudPrestamoRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use("/api/prestamos", prestamoRoutes);
// Static del front
app.use(express.static(path.join(__dirname, '../client/dist')));

// Fallback SPA: cualquier ruta que NO empiece con /api -> index.html
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// 404 para rutas API no encontradas
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});