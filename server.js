// ==========================
// IMPORTS
// ==========================
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import pool from './db.js'; 

// ==========================
// CONFIGURACIÓN BÁSICA
// ==========================
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ==========================
// RUTAS PRINCIPALES
// ==========================
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);

// ==========================
// RUTA DE PRUEBA BACKEND
// ==========================
app.get('/', (req, res) => {
  res.send('Servidor corriendo correctamente');
});

// ==========================
// RUTA DE PRUEBA BASE DE DATOS
// ==========================
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      message: 'Conexión exitosa a la base de datos',
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error('Error en la conexión:', error);
    res.status(500).json({
      message: 'Error en la conexión a la base de datos',
      error: error.message,
    });
  }
});

// ==========================
// LEVANTAR SERVIDOR
// ==========================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
