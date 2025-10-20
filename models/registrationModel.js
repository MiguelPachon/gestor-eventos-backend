import pool from "../db.js";

export const addRegistration = async (userId, eventId) => {
  const checkCupo = await pool.query(
    "SELECT COUNT(*) AS count, max_capacity FROM events WHERE id = $1 GROUP BY max_capacity",
    [eventId]
  );

  const { count, max_capacity } = checkCupo.rows[0];

  if (parseInt(count) >= parseInt(max_capacity)) {
    throw new Error("No hay más cupos disponibles para este evento.");
  }

  const result = await pool.query(
    "INSERT INTO registrations (user_id, event_id) VALUES ($1, $2) RETURNING *",
    [userId, eventId]
  );

  return result.rows[0];
};

export const getRegistrationsByUser = async (userId) => {
  const result = await pool.query(
    `SELECT e.id, e.title, e.date, e.location, e.description
     FROM registrations r
     JOIN events e ON r.event_id = e.id
     WHERE r.user_id = $1`,
    [userId]
  );
  return result.rows;
};

export const cancelRegistration = async (userId, eventId) => {
  const result = await pool.query(
    "DELETE FROM registrations WHERE user_id = $1 AND event_id = $2 RETURNING *",
    [userId, eventId]
  );
  return result.rows[0];
};
