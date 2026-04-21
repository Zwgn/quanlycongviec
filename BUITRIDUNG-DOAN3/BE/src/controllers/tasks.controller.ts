import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AppError } from "../services/auth.service";
import { tasksService } from "../services/tasks.service";

const handleErrorResponse = (res: Response, error: unknown): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: "Lỗi máy chủ nội bộ"
  });
};

export const createTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const task = await tasksService.create({
      title: String(req.body?.title ?? ""),
      label: req.body?.label !== undefined ? String(req.body.label) : undefined,
      listId: Number(req.body?.listId),
      userId: req.user.userId
    });

    res.status(201).json(task);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getTaskDetailController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const task = await tasksService.getDetail(Number(req.params.taskId), req.user.userId);

    res.status(200).json(task);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const moveTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const task = await tasksService.move({
      taskId: Number(req.params.taskId),
      targetListId: Number(req.body?.targetListId),
      position: req.body?.position !== undefined ? Number(req.body.position) : undefined,
      userId: req.user.userId
    });

    res.status(200).json(task);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const task = await tasksService.update({
      taskId: Number(req.params.taskId),
      title: req.body?.title !== undefined ? String(req.body.title) : undefined,
      label:
        req.body?.label !== undefined
          ? req.body.label === null
            ? null
            : String(req.body.label)
          : undefined,
      description: req.body?.description !== undefined ? String(req.body.description) : undefined,
      dueDate: req.body?.dueDate !== undefined ? String(req.body.dueDate) : undefined,
      priority: req.body?.priority !== undefined ? String(req.body.priority) : undefined,
      status: req.body?.status !== undefined ? String(req.body.status) : undefined,
      userId: req.user.userId
    });

    res.status(200).json(task);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const result = await tasksService.remove(Number(req.params.taskId), req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
