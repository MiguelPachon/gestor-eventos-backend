import { addRegistration, getRegistrationsByUser, cancelRegistration } from "../models/registrationModel.js";

export const registerToEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.body;

    const registration = await addRegistration(userId, eventId);
    res.status(201).json({ message: "Inscripción exitosa", registration });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getMyRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    const registrations = await getRegistrationsByUser(userId);
    res.json(registrations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelMyRegistration = async (req, res) => {
  try {
    const userId = req.user.id;
    const { eventId } = req.params;

    const canceled = await cancelRegistration(userId, eventId);
    if (!canceled) return res.status(404).json({ message: "No estabas inscrito en este evento" });

    res.json({ message: "Inscripción cancelada correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
