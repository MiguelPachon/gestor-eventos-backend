import express from "express";
import { registerToEvent, getMyRegistrations, cancelMyRegistration } from "../controllers/registrationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, registerToEvent);
router.get("/", verifyToken, getMyRegistrations);
router.delete("/:eventId", verifyToken, cancelMyRegistration);

export default router;
