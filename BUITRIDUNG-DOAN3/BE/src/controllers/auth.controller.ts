import { Request, Response } from "express";
import { AppError, authService } from "../services/auth.service";

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

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: result
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const forgotPasswordController = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await authService.forgotPassword(req.body);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
