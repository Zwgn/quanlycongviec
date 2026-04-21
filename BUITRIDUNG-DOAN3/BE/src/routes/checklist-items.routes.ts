import { Router } from "express";
import {
  createChecklistItemController,
  deleteChecklistItemController,
  moveChecklistItemController,
  toggleChecklistItemController,
  updateChecklistItemController
} from "../controllers/task-detail.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const checklistItemsRouter = Router();

checklistItemsRouter.post("/", verifyToken, createChecklistItemController);
checklistItemsRouter.put("/:id", verifyToken, updateChecklistItemController);
checklistItemsRouter.patch("/:id/toggle", verifyToken, toggleChecklistItemController);
checklistItemsRouter.put("/:id/move", verifyToken, moveChecklistItemController);
checklistItemsRouter.delete("/:id", verifyToken, deleteChecklistItemController);

export default checklistItemsRouter;
