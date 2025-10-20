import express from "express";
import pool from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// =========================
// Obtener todos los eventos
// =========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.*, u.name AS organizer_name, 
              (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       ORDER BY e.date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener eventos:", err);
    res.status(500).json({ message: "Error al obtener eventos" });
  }
});

// =========================
// Crear un nuevo evento (solo organizadores)
// =========================
router.post("/", verifyToken, async (req, res) => {
  const { title, description, category, date, location, max_capacity, image } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== "organizer") {
    return res.status(403).json({ message: "Solo los organizadores pueden crear eventos." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, category, date, location, max_capacity, image, organizer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, category, date, location, max_capacity, image, userId]
    );
    res.status(201).json({ message: "Evento creado con éxito", event: result.rows[0] });
  } catch (err) {
    console.error("Error al crear evento:", err);
    res.status(500).json({ message: "Error al crear el evento" });
  }
});

// =========================
// Inscribirse a un evento
// =========================
router.post("/:id/register", verifyToken, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    // verificar si el evento existe
    const event = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
    if (event.rows.length === 0) return res.status(404).json({ message: "Evento no encontrado" });

    const current = await pool.query("SELECT COUNT(*) FROM registrations WHERE event_id = $1", [eventId]);
    const registeredCount = parseInt(current.rows[0].count);

    if (registeredCount >= event.rows[0].max_capacity) {
      return res.status(400).json({ message: "Cupo lleno, no se pueden inscribir más usuarios." });
    }

    // verificar si ya está inscrito
    const existing = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Ya estás inscrito en este evento." });

    // registrar
    await pool.query(
      "INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)",
      [userId, eventId]
    );
    res.json({ message: "Inscripción realizada con éxito" });
  } catch (err) {
    console.error("Error al inscribirse:", err);
    res.status(500).json({ message: "Error al inscribirse al evento" });
  }
});

// =========================
// Cancelar inscripción
// =========================
router.delete("/:id/cancel", verifyToken, async (req, res) => {
  const eventId = req.params.id;
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "DELETE FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ message: "No estás inscrito en este evento." });

    res.json({ message: "Inscripción cancelada correctamente" });
  } catch (err) {
    console.error("Error al cancelar inscripción:", err);
    res.status(500).json({ message: "Error al cancelar la inscripción" });
  }
});

// =========================
// Ver eventos creados por el organizador
// =========================
router.get("/mine", verifyToken, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  if (role !== "organizer")
    return res.status(403).json({ message: "Solo los organizadores pueden ver sus eventos creados." });

  try {
    const result = await pool.query("SELECT * FROM events WHERE organizer_id = $1 ORDER BY date DESC", [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error al obtener eventos del organizador:", err);
    res.status(500).json({ message: "Error al obtener eventos del organizador" });
  }
});

export default router;
