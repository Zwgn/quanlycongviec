import { Router } from "express";
import {
  createAttachmentController,
  deleteAttachmentController,
  getAttachmentsByTaskController
} from "../controllers/task-detail.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const attachmentsRouter = Router();

attachmentsRouter.get("/", verifyToken, getAttachmentsByTaskController);
attachmentsRouter.post("/", verifyToken, createAttachmentController);
attachmentsRouter.delete("/:attachmentId", verifyToken, deleteAttachmentController);

export default attachmentsRouter;
