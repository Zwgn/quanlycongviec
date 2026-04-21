import { Router } from "express";
import { createListController, deleteListController } from "../controllers/lists.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const listsRouter = Router();

listsRouter.post("/", verifyToken, createListController);
listsRouter.delete("/:listId", verifyToken, deleteListController);

export default listsRouter;
