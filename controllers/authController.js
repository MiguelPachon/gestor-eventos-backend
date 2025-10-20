import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../models/userModel.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await getUserByEmail(email);
    if (existing) return res.status(400).json({ error: 'Correo ya registrado' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, hashed, role);

    res.json({ message: 'Registro exitoso', user });
  } catch (err) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) return res.status(400).json({ error: 'Usuario no encontrado' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({ message: 'Login exitoso', token, user });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};
