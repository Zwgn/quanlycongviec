import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import activityRouter from "./routes/activity.routes";
import attachmentsRouter from "./routes/attachments.routes";
import authRouter from "./routes/auth.routes";
import boardsRouter from "./routes/boards.routes";
import checklistItemsRouter from "./routes/checklist-items.routes";
import commentsRouter from "./routes/comments.routes";
import listsRouter from "./routes/lists.routes";
import projectsRouter from "./routes/projects.routes";
import taskAssigneesRouter from "./routes/task-assignees.routes";
import tasksRouter from "./routes/tasks.routes";
import usersRouter from "./routes/users.routes";
import workspacesRouter from "./routes/workspaces.routes";
import { AppError } from "./services/auth.service";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? true,
    credentials: true
  })
);

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/workspaces", workspacesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/boards", boardsRouter);
app.use("/api/lists", listsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/checklist-items", checklistItemsRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/attachments", attachmentsRouter);
app.use("/api/activity", activityRouter);
app.use("/api/task-assignees", taskAssigneesRouter);

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Server is running"
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

export default app;
