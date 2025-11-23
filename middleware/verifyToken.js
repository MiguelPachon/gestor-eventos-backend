import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export default function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token no proporcionado" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Token inválido" });
    }

    req.user = decoded;
    next();
  });
}
