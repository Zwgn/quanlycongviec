import { Router } from "express";
import {
  createTaskController,
  deleteTaskController,
  getTaskDetailController,
  moveTaskController,
  updateTaskController
} from "../controllers/tasks.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const tasksRouter = Router();

tasksRouter.post("/", verifyToken, createTaskController);
tasksRouter.get("/:taskId", verifyToken, getTaskDetailController);
tasksRouter.put("/:taskId/move", verifyToken, moveTaskController);
tasksRouter.put("/:taskId", verifyToken, updateTaskController);
tasksRouter.delete("/:taskId", verifyToken, deleteTaskController);

export default tasksRouter;
