import express from "express";
import pool from "../db.js";
import verifyToken from "../middleware/verifyToken.js";
import { sendRegistrationConfirmation } from '../services/emailService.js';

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
// Crear un nuevo evento 
// =========================
router.post("/", verifyToken, async (req, res) => {
  const { title, description, category, date, location, max_capacity, image } = req.body;
  const userId = req.user.id;
  const role = req.user.role;

  try {

    
    if (role === "user" && max_capacity > 20) {
      return res.status(400).json({
        message: "Los usuarios normales solo pueden crear eventos pequeños (máximo 20 personas)."
      });
    }

    const finalCapacity = role === "user" ? Math.min(max_capacity, 20) : max_capacity;

    const result = await pool.query(
      `INSERT INTO events (title, description, category, date, location, max_capacity, image, organizer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, description, category, date, location, finalCapacity, image, userId]
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
    const event = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
    if (event.rows.length === 0) return res.status(404).json({ message: "Evento no encontrado" });

    const current = await pool.query("SELECT COUNT(*) FROM registrations WHERE event_id = $1", [eventId]);
    const registeredCount = parseInt(current.rows[0].count);

    if (registeredCount >= event.rows[0].max_capacity) {
      return res.status(400).json({ message: "Cupo lleno, no se pueden inscribir más usuarios." });
    }

    const existing = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ message: "Ya estás inscrito en este evento." });

    
    await pool.query(
      "INSERT INTO registrations (user_id, event_id) VALUES ($1, $2)",
      [userId, eventId]
    );

    
    const user = await pool.query("SELECT name, email FROM users WHERE id = $1", [userId]);
    const eventDetails = event.rows[0];
    
    try {
      await sendRegistrationConfirmation(
        user.rows[0].email,
        user.rows[0].name,
        eventDetails
      );
      console.log(`Email de confirmación enviado a ${user.rows[0].email}`);
    } catch (emailError) {
      console.error('Error enviando email de confirmación:', emailError);
      
    }

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
  const eventId = parseInt(req.params.id); 
  const userId = req.user.id;

  try {
    
    const existing = await pool.query(
      "SELECT * FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );

    if (existing.rowCount === 0) {
      return res.status(404).json({ message: "No estás inscrito en este evento." });
    }

    // Cancelar inscripción
    await pool.query(
      "DELETE FROM registrations WHERE user_id = $1 AND event_id = $2",
      [userId, eventId]
    );

    // Obtener nuevo número de inscritos
    const updated = await pool.query(
      "SELECT COUNT(*) FROM registrations WHERE event_id = $1",
      [eventId]
    );

    res.json({
      message: "Inscripción cancelada",
      registered: parseInt(updated.rows[0].count)
    });

  } catch (err) {
    console.error("Error al cancelar inscripción:", err);
    res.status(500).json({ message: "Error al cancelar la inscripción" });
  }
});


// =========================
// Ver eventos creados 
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

// =========================
// Eliminar evento
// =========================
router.delete("/:id", verifyToken, async (req, res) => {
  const eventId = parseInt(req.params.id);
  const userId = req.user.id;
  const role = req.user.role;

  try {
    
    const result = await pool.query("SELECT * FROM events WHERE id = $1", [eventId]);
    if (result.rowCount === 0)
      return res.status(404).json({ message: "Evento no encontrado" });

    const event = result.rows[0];

    // Solo el creador u organizador pueden borrar
    if (event.organizer_id !== userId && role !== "organizer")
      return res.status(403).json({ message: "No tienes permiso para eliminar este evento." });

    // Eliminar inscripciones
    await pool.query("DELETE FROM registrations WHERE event_id = $1", [eventId]);

    // Eliminar evento
    await pool.query("DELETE FROM events WHERE id = $1", [eventId]);

    res.json({ message: "Evento eliminado correctamente", eventId });
  } catch (err) {
    console.error("Error eliminando evento:", err);
    res.status(500).json({ message: "Error al eliminar el evento" });
  }
});


export default router;
