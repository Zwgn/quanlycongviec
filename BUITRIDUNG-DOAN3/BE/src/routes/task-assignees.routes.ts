import { Router } from "express";
import {
  addTaskAssigneeController,
  getTaskAssigneesByTaskController,
  removeTaskAssigneeController
} from "../controllers/task-detail.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const taskAssigneesRouter = Router();

taskAssigneesRouter.get("/", verifyToken, getTaskAssigneesByTaskController);
taskAssigneesRouter.post("/", verifyToken, addTaskAssigneeController);
taskAssigneesRouter.delete("/", verifyToken, removeTaskAssigneeController);

export default taskAssigneesRouter;
