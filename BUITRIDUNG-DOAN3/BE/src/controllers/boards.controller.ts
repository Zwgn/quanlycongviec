import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { AppError } from "../services/auth.service";
import { boardsService } from "../services/boards.service";

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

export const getBoardDataController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const boardId = Number(req.params.boardId);
    const data = await boardsService.getBoardData(boardId, req.user.userId);

    res.status(200).json(data);
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
