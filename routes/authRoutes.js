import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// =========================
// REGISTRO DE USUARIO
// =========================
router.post("/register", async (req, res) => {
  const { name, email, password, role, nit, phone, document } = req.body;

  try {
    // Verificar si el usuario ya existe
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0)
      return res.status(400).json({ message: "El correo ya está registrado." });

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar usuario nuevo
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, nit, phone, document)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role || "user", nit, phone, document]
    );

    // Crear token JWT
    const token = jwt.sign(
      { id: result.rows[0].id, email, role: result.rows[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      message: "Registro exitoso",
      user: result.rows[0],
      token,
    });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ message: "Error al registrar usuario" });
  }
});

// =========================
// INICIO DE SESIÓN
// =========================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ message: "Correo o contraseña incorrectos" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Correo o contraseña incorrectos" });

    // Crear token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Obtener inscripciones del usuario
    const regs = await pool.query(
      "SELECT event_id FROM registrations WHERE user_id = $1",
      [user.id]
    );

    const registeredEvents = regs.rows.map(r => r.event_id);

    res.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registeredEvents
      },
      token,
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

export default router;
