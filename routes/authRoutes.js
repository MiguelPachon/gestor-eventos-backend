import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import dotenv from "dotenv";
import verifyToken from "../middleware/verifyToken.js";


dotenv.config();
const router = express.Router();

// =========================
// REGISTRO DE USUARIO
// =========================
router.post("/register", async (req, res) => {
  const { name, email, password, role, nit, phone, document } = req.body;

  try {
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0)
      return res.status(400).json({ message: "El correo ya está registrado." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, nit, phone, document)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role || "user", nit, phone, document]
    );

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
// LOGIN NORMAL
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

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    const regs = await pool.query(
      "SELECT event_id FROM registrations WHERE user_id = $1",
      [user.id]
    );
    const registeredEvents = regs.rows.map(r => r.event_id);

    const created = await pool.query(
      "SELECT id FROM events WHERE organizer_id = $1",
      [user.id]
    );
    const createdEvents = created.rows.map(e => e.id);

    res.json({
      message: "Inicio de sesión exitoso",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        registeredEvents,
        createdEvents
      },
      token,
    });

  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
});

// =========================
// LOGIN CON GOOGLE
// =========================
router.post("/google-login", async (req, res) => {
  const { name, email } = req.body;

  try {
    let result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    let user;

    if (result.rows.length === 0) {
      const insert = await pool.query(
        `INSERT INTO users (name, email, role)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role`,
        [name, email, "user"]
      );
      user = insert.rows[0];
    } else {
      user = result.rows[0];
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error con Google Login" });
  }
});


// =========================
// RUTA PARA OBTENER DATOS DEL USUARIO CON TOKEN
// =========================
router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });

    const regs = await pool.query(
      "SELECT event_id FROM registrations WHERE user_id = $1",
      [req.user.id]
    );

    const created = await pool.query(
      "SELECT id FROM events WHERE organizer_id = $1",
      [req.user.id]
    );

    res.json({
      user: {
        ...result.rows[0],
        registeredEvents: regs.rows.map(r => r.event_id),
        createdEvents: created.rows.map(e => e.id)
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error al obtener usuario" });
  }
});


export default router;
