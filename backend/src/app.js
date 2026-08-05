import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
const app = express();
app.use(express.json());
app.use(cookieParser());

// auth router
app.use("/api/auth", authRouter);

export default app;
