import { Router } from "express";
import { getBoardDataController } from "../controllers/boards.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const boardsRouter = Router();

boardsRouter.get("/:boardId", verifyToken, getBoardDataController);

export default boardsRouter;
