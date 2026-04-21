import { Router } from "express";
import {
  addWorkspaceMemberController,
  createWorkspaceController,
  deleteWorkspaceController,
  getWorkspaceMembersController,
  getWorkspacesController,
  removeWorkspaceMemberController,
  updateWorkspaceController,
  updateWorkspaceMemberRoleController
} from "../controllers/workspaces.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const workspacesRouter = Router();

workspacesRouter.get("/", verifyToken, getWorkspacesController);
workspacesRouter.post("/", verifyToken, createWorkspaceController);
workspacesRouter.put("/:workspaceId", verifyToken, updateWorkspaceController);
workspacesRouter.delete("/:workspaceId", verifyToken, deleteWorkspaceController);

workspacesRouter.get("/:workspaceId/members", verifyToken, getWorkspaceMembersController);
workspacesRouter.post("/:workspaceId/members", verifyToken, addWorkspaceMemberController);
workspacesRouter.put("/:workspaceId/members/:memberUserId/role", verifyToken, updateWorkspaceMemberRoleController);
workspacesRouter.delete("/:workspaceId/members/:memberUserId", verifyToken, removeWorkspaceMemberController);

export default workspacesRouter;
