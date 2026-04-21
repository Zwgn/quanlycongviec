import { Response } from "express";
import { AppError } from "../services/auth.service";
import { workspacesService } from "../services/workspaces.service";
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

export const getWorkspacesController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
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
      throw new AppError("Unauthorized", 401);
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
      throw new AppError("Unauthorized", 401);
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
      throw new AppError("Unauthorized", 401);
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
      throw new AppError("Unauthorized", 401);
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
      throw new AppError("Unauthorized", 401);
    }

    const member = await workspacesService.addMember({
      workspaceId: Number(req.params.workspaceId),
      email: String(req.body?.email ?? ""),
      role: (req.body?.role ?? "Member") as "Admin" | "Member",
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
      throw new AppError("Unauthorized", 401);
    }

    const member = await workspacesService.updateMemberRole({
      workspaceId: Number(req.params.workspaceId),
      memberUserId: Number(req.params.memberUserId),
      role: (req.body?.role ?? "Member") as "Admin" | "Member",
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
      throw new AppError("Unauthorized", 401);
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
