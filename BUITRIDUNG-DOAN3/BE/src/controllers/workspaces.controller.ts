import { Response } from "express";
import { AppError } from "../services/auth.service";
import { workspacesService } from "../services/workspaces.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";

const normalizeWorkspaceMemberRole = (rawRole: unknown): "Admin" | "Member" => {
  const value = String(rawRole ?? "").trim();

  if (value === "Admin" || value.toLowerCase() === "admin" || value === "Quản trị viên") {
    return "Admin";
  }

  if (value === "Member" || value.toLowerCase() === "member" || value === "Thành viên") {
    return "Member";
  }

  throw new AppError("Role không hợp lệ", 400);
};

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

export const getWorkspacesController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const workspaces = await workspacesService.getByUser(req.user.userId);

    res.status(200).json({
      success: true,
      data: workspaces
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const createWorkspaceController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const workspace = await workspacesService.create({
      name: String(req.body?.name ?? ""),
      ownerId: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: workspace
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateWorkspaceController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const workspace = await workspacesService.update({
      workspaceId: Number(req.params.workspaceId),
      name: String(req.body?.name ?? ""),
      description: req.body?.description ? String(req.body.description) : undefined,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: workspace
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteWorkspaceController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const result = await workspacesService.remove(Number(req.params.workspaceId), req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getWorkspaceMembersController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const members = await workspacesService.getMembers(
      Number(req.params.workspaceId),
      req.user.userId
    );

    res.status(200).json({
      success: true,
      data: members
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const addWorkspaceMemberController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const normalizedRole = normalizeWorkspaceMemberRole(req.body?.role ?? "Member");

    const member = await workspacesService.addMember({
      workspaceId: Number(req.params.workspaceId),
      email: String(req.body?.email ?? ""),
      role: normalizedRole,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      data: member
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateWorkspaceMemberRoleController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const normalizedRole = normalizeWorkspaceMemberRole(req.body?.role ?? "Member");

    const member = await workspacesService.updateMemberRole({
      workspaceId: Number(req.params.workspaceId),
      memberUserId: Number(req.params.memberUserId),
      role: normalizedRole,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const removeWorkspaceMemberController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const result = await workspacesService.removeMember({
      workspaceId: Number(req.params.workspaceId),
      memberUserId: Number(req.params.memberUserId),
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};
