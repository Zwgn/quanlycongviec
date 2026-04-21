import { Response } from "express";
import { AppError } from "../services/auth.service";
import { projectsService } from "../services/projects.service";
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
    message: "Lỗi máy chủ nội bộ"
  });
};

export const getProjectsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const workspaceId = Number(req.query.workspaceId);
    const projects = await projectsService.getByWorkspace(workspaceId, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách dự án thành công",
      data: projects
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const createProjectController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const project = await projectsService.create({
      workspaceId: Number(req.body?.workspaceId),
      name: String(req.body?.name ?? ""),
      description: req.body?.description ? String(req.body.description) : undefined,
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: "Tạo dự án thành công",
      data: project
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateProjectController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const projectId = Number(req.params.projectId);
    const project = await projectsService.update({
      projectId,
      name: String(req.body?.name ?? ""),
      description: req.body?.description ? String(req.body.description) : undefined,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật dự án thành công",
      data: project
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const deleteProjectController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const projectId = Number(req.params.projectId);
    const result = await projectsService.remove(projectId, req.user.userId);

    res.status(200).json({
      success: true,
      message: result.message || "Đã xóa dự án thành công."
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const getProjectMembersController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const projectId = Number(req.params.projectId);
    const members = await projectsService.getMembers(projectId, req.user.userId);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách thành viên dự án thành công",
      data: members
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const addProjectMemberController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const member = await projectsService.addMember({
      projectId: Number(req.params.projectId),
      email: String(req.body?.email ?? ""),
      role: (req.body?.role ?? "Member") as "Admin" | "Member",
      userId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: "Thêm thành viên vào dự án thành công",
      data: member
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const updateProjectMemberRoleController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const member = await projectsService.updateMemberRole({
      projectId: Number(req.params.projectId),
      memberUserId: Number(req.params.memberUserId),
      role: (req.body?.role ?? "Member") as "Admin" | "Member",
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: "Cập nhật quyền thành viên dự án thành công",
      data: member
    });
  } catch (error: unknown) {
    handleErrorResponse(res, error);
  }
};

export const removeProjectMemberController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError("Bạn chưa đăng nhập", 401);
    }

    const result = await projectsService.removeMember({
      projectId: Number(req.params.projectId),
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
