import { Router } from "express";
import { getMeController } from "../controllers/users.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const usersRouter = Router();

usersRouter.get("/me", verifyToken, getMeController);

export default usersRouter;
