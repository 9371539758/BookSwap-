import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getConnections, getMessages } from "../controllers/connection.controller.js";

const router = Router();

router.use(authMiddleware);
router.get("/", getConnections);
router.get("/:connectionId/messages", getMessages);

export default router;
