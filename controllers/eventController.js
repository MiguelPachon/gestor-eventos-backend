import { createEvent, getAllEvents } from '../models/eventModel.js';

export const getEvents = async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

export const addEvent = async (req, res) => {
  try {
    const { title, description, date, location, max_capacity, creator_id } = req.body;
    const newEvent = await createEvent(title, description, date, location, max_capacity, creator_id);
    res.json({ message: 'Evento creado con éxito', event: newEvent });
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento' });
  }
};
