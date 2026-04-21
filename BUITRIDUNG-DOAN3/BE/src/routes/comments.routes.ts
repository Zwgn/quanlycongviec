import { Router } from "express";
import {
  createCommentController,
  deleteCommentController,
  getCommentsByTaskController
} from "../controllers/task-detail.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const commentsRouter = Router();

commentsRouter.get("/", verifyToken, getCommentsByTaskController);
commentsRouter.post("/", verifyToken, createCommentController);
commentsRouter.delete("/:commentId", verifyToken, deleteCommentController);

export default commentsRouter;
