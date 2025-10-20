import pool from '../db.js';

export const createEvent = async (title, description, date, location, max_capacity, creator_id) => {
  const result = await pool.query(
    `INSERT INTO events (title, description, date, location, max_capacity, creator_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, description, date, location, max_capacity, creator_id]
  );
  return result.rows[0];
};

export const getAllEvents = async () => {
  const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
  return result.rows;
};
