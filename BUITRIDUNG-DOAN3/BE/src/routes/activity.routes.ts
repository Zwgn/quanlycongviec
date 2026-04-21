import { Router } from "express";
import { getActivityByTaskController } from "../controllers/task-detail.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const activityRouter = Router();

activityRouter.get("/", verifyToken, getActivityByTaskController);

export default activityRouter;
