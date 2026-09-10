import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getConnections,
  getMessages,
  deleteConnectionForUser,
} from "../controllers/connection.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getConnections);
router.get("/:connectionId/messages", getMessages);
router.delete("/:connectionId", deleteConnectionForUser);

export default router;
