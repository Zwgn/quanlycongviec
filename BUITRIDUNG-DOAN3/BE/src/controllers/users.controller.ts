import { Response } from "express";
import { AppError } from "../services/auth.service";
import { usersService } from "../services/users.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

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
    message: "Internal server error"
  });
};

export const getMeController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await usersService.getMe(req.user.userId);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
