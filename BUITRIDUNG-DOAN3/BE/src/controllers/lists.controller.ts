import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AppError } from "../services/auth.service";
import { listsService } from "../services/lists.service";

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

export const createListController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const list = await listsService.create({
      name: String(req.body?.name ?? ""),
      boardId: Number(req.body?.boardId),
      userId: req.user.userId
    });

    res.status(201).json(list);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteListController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const result = await listsService.remove(Number(req.params.listId), req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateListController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const list = await listsService.update({
      listId: Number(req.params.listId),
      name: String(req.body?.name ?? ""),
      userId: req.user.userId
    });

    res.status(200).json(list);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
