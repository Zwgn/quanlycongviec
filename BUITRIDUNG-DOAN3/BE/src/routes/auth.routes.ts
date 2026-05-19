import { Router } from "express";
import { loginController, registerController, forgotPasswordController } from "../controllers/auth.controller";

const authRouter = Router();

authRouter.post("/register", registerController);
authRouter.post("/login", loginController);
authRouter.post("/forgot-password", forgotPasswordController);

export default authRouter;
