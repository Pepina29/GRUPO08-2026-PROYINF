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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares globales
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// API
app.use('/api', authRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/simulations', simulationRoutes);
app.use('/api', documentRoutes);

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