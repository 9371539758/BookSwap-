import { Router } from "express";
import {registerValidator} from "../validators/register.validtor.js";
const authRouter = Router();
import { register,login } from "../controllers/auth.controller.js";
authRouter.post("/register",registerValidator,register);
authRouter.post("/login",login);
export default authRouter;