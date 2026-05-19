import { Router } from "express";
import { changePasswordController, getMeController } from "../controllers/users.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const usersRouter = Router();

usersRouter.get("/me", verifyToken, getMeController);
usersRouter.post("/change-password", verifyToken, changePasswordController);

export default usersRouter;
