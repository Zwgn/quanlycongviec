import { Router } from "express";
import {
  addProjectMemberController,
  createProjectController,
  deleteProjectController,
  getProjectMembersController,
  getProjectsController,
  removeProjectMemberController,
  updateProjectMemberRoleController,
  updateProjectController
} from "../controllers/projects.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const projectsRouter = Router();

projectsRouter.get("/", verifyToken, getProjectsController);
projectsRouter.post("/", verifyToken, createProjectController);
projectsRouter.put("/:projectId", verifyToken, updateProjectController);
projectsRouter.delete("/:projectId", verifyToken, deleteProjectController);
projectsRouter.get("/:projectId/members", verifyToken, getProjectMembersController);
projectsRouter.post("/:projectId/members", verifyToken, addProjectMemberController);
projectsRouter.put("/:projectId/members/:memberUserId/role", verifyToken, updateProjectMemberRoleController);
projectsRouter.delete("/:projectId/members/:memberUserId", verifyToken, removeProjectMemberController);

export default projectsRouter;
