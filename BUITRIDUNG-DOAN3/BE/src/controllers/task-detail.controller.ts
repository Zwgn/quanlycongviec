import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AppError } from "../services/auth.service";
import { taskDetailService } from "../services/task-detail.service";

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

const requireAuthUserId = (req: AuthenticatedRequest): number => {
  if (!req.user) {
    throw new AppError("Bạn chưa đăng nhập", 401);
  }

  return req.user.userId;
};

export const createChecklistItemController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const item = await taskDetailService.createChecklistItem({
      taskId: Number(req.body?.taskId),
      content: String(req.body?.content ?? ""),
      position: req.body?.position !== undefined ? Number(req.body.position) : undefined,
      userId: requireAuthUserId(req)
    });

    res.status(201).json(item);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateChecklistItemController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const item = await taskDetailService.updateChecklistItem({
      id: Number(req.params.id),
      content: String(req.body?.content ?? ""),
      userId: requireAuthUserId(req)
    });

    res.status(200).json(item);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const toggleChecklistItemController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const item = await taskDetailService.toggleChecklistItem(
      Number(req.params.id),
      requireAuthUserId(req)
    );

    res.status(200).json(item);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const moveChecklistItemController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const item = await taskDetailService.moveChecklistItem({
      id: Number(req.params.id),
      position: Number(req.body?.position),
      userId: requireAuthUserId(req)
    });

    res.status(200).json(item);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteChecklistItemController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await taskDetailService.deleteChecklistItem(
      Number(req.params.id),
      requireAuthUserId(req)
    );

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getCommentsByTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const comments = await taskDetailService.getCommentsByTask(
      Number(req.query.taskId),
      requireAuthUserId(req)
    );

    res.status(200).json(comments);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const createCommentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const comment = await taskDetailService.createComment({
      taskId: Number(req.body?.taskId),
      content: String(req.body?.content ?? ""),
      userId: requireAuthUserId(req)
    });

    res.status(201).json(comment);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteCommentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await taskDetailService.deleteComment(
      Number(req.params.commentId),
      requireAuthUserId(req)
    );

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getAttachmentsByTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const attachments = await taskDetailService.getAttachmentsByTask(
      Number(req.query.taskId),
      requireAuthUserId(req)
    );

    res.status(200).json(attachments);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const createAttachmentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const attachment = await taskDetailService.createAttachment({
      taskId: Number(req.body?.taskId),
      fileName: req.body?.fileName !== undefined ? String(req.body.fileName) : undefined,
      fileUrl: String(req.body?.fileUrl ?? ""),
      userId: requireAuthUserId(req)
    });

    res.status(201).json(attachment);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteAttachmentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const result = await taskDetailService.deleteAttachment(
      Number(req.params.attachmentId),
      requireAuthUserId(req)
    );

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getActivityByTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const activity = await taskDetailService.getActivityByTask(
      Number(req.query.taskId),
      requireAuthUserId(req)
    );

    res.status(200).json(activity);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getTaskAssigneesByTaskController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const assignees = await taskDetailService.getTaskAssigneesByTask(
      Number(req.query.taskId),
      requireAuthUserId(req)
    );

    res.status(200).json(assignees);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const addTaskAssigneeController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const assignee = await taskDetailService.addTaskAssignee({
      taskId: Number(req.body?.taskId),
      assigneeUserId: Number(req.body?.assigneeUserId),
      userId: requireAuthUserId(req)
    });

    res.status(201).json(assignee);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const removeTaskAssigneeController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const taskId = Number(req.body?.taskId ?? req.query.taskId);
    const assigneeUserId = Number(req.body?.assigneeUserId ?? req.query.assigneeUserId);

    const result = await taskDetailService.removeTaskAssignee({
      taskId,
      assigneeUserId,
      userId: requireAuthUserId(req)
    });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
