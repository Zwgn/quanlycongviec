import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface ProjectItem {
  projectId: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

interface CreateProjectInput {
  workspaceId: number;
  name: string;
  description?: string;
  userId: number;
}

interface UpdateProjectInput {
  projectId: number;
  name: string;
  description?: string;
  userId: number;
}

interface UpdatedProjectItem {
  projectId: number;
  name: string;
  description: string | null;
  updatedAt: Date;
}

interface ProjectMemberItem {
  userId: number;
  fullName: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  joinedAt: Date;
}

interface AddProjectMemberInput {
  projectId: number;
  email: string;
  role: "Admin" | "Member";
  userId: number;
}

interface UpdateProjectMemberRoleInput {
  projectId: number;
  memberUserId: number;
  role: "Admin" | "Member";
  userId: number;
}

interface RemoveProjectMemberInput {
  projectId: number;
  memberUserId: number;
  userId: number;
}

const mapProjectMemberError = (error: unknown, action: string): never => {
  const dbError = error as { message?: string };

  if (dbError.message?.includes("Không có quyền") || dbError.message?.includes("Forbidden")) {
    throw new AppError(`Bạn không có quyền ${action}`, 403);
  }

  if (dbError.message?.includes("Không tìm thấy Project")) {
    throw new AppError("Không tìm thấy dự án", 404);
  }

  if (
    dbError.message?.includes("Không tìm thấy thành viên") ||
    dbError.message?.includes("Không tìm thấy người dùng")
  ) {
    throw new AppError(dbError.message ?? "Không tìm thấy thành viên", 404);
  }

  if (dbError.message?.includes("Role không hợp lệ")) {
    throw new AppError("Role không hợp lệ", 400);
  }

  if (
    dbError.message?.includes("chỉ có thể") ||
    dbError.message?.includes("Không thể thay đổi quyền") ||
    dbError.message?.includes("Không thể xóa Owner") ||
    dbError.message?.includes("đã là Owner")
  ) {
    throw new AppError(dbError.message ?? "Yêu cầu không hợp lệ", 409);
  }

  throw error;
};

export const projectsService = {
  async getByWorkspace(workspaceId: number, userId: number): Promise<ProjectItem[]> {
    if (!workspaceId || Number.isNaN(workspaceId)) {
      throw new AppError("ID không gian làm việc không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("workspaceId", sql.Int, workspaceId)
        .input("userId", sql.Int, userId)
        .execute("sp_Project_GetByWorkspace");

      return (result.recordset ?? []) as ProjectItem[];
    } catch (error: unknown) {
      const dbError = error as { message?: string };
      if (dbError.message?.includes("Forbidden") || dbError.message?.includes("Không có quyền")) {
        throw new AppError("Bạn không có quyền truy cập không gian làm việc này", 403);
      }

      throw error;
    }
  },

  async create(input: CreateProjectInput): Promise<ProjectItem> {
    const name = input.name?.trim();

    if (!name) {
      throw new AppError("Tên dự án là bắt buộc", 400);
    }

    if (!input.workspaceId || Number.isNaN(input.workspaceId)) {
      throw new AppError("ID không gian làm việc không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("workspaceId", sql.Int, input.workspaceId)
        .input("name", sql.NVarChar(255), name)
        .input("description", sql.NVarChar(sql.MAX), input.description?.trim() || null)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Project_Create");

      const project = result.recordset?.[0] as ProjectItem | undefined;

      if (!project) {
        throw new AppError("Tạo dự án thất bại", 500);
      }

      return project;
    } catch (error: unknown) {
      const dbError = error as { message?: string };
      if (dbError.message?.includes("Forbidden") || dbError.message?.includes("Không có quyền")) {
        throw new AppError("Bạn không có quyền tạo dự án trong không gian làm việc này", 403);
      }

      throw error;
    }
  },

  async update(input: UpdateProjectInput): Promise<UpdatedProjectItem> {
    const name = input.name?.trim();

    if (!input.projectId || Number.isNaN(input.projectId)) {
      throw new AppError("ID dự án không hợp lệ", 400);
    }

    if (!name) {
      throw new AppError("Tên dự án là bắt buộc", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("projectId", sql.Int, input.projectId)
        .input("name", sql.NVarChar(255), name)
        .input("description", sql.NVarChar(sql.MAX), input.description?.trim() || null)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Project_Update");

      const updated = result.recordset?.[0] as UpdatedProjectItem | undefined;

      if (!updated) {
        throw new AppError("Cập nhật dự án thất bại", 500);
      }

      return updated;
    } catch (error: unknown) {
      const dbError = error as { message?: string };

      if (dbError.message?.includes("Project not found") || dbError.message?.includes("Không tìm thấy Project")) {
        throw new AppError("Không tìm thấy dự án", 404);
      }

      if (dbError.message?.includes("Forbidden") || dbError.message?.includes("Không có quyền")) {
        throw new AppError("Bạn không có quyền sửa dự án này", 403);
      }

      throw error;
    }
  },

  async remove(projectId: number, userId: number): Promise<{ message: string }> {
    if (!projectId || Number.isNaN(projectId)) {
      throw new AppError("ID dự án không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("projectId", sql.Int, projectId)
        .input("userId", sql.Int, userId)
        .execute("sp_Project_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;
      return { message: message ?? "Đã xóa dự án thành công." };
    } catch (error: unknown) {
      const dbError = error as { message?: string };

      if (dbError.message?.includes("Project not found") || dbError.message?.includes("Không tìm thấy project")) {
        throw new AppError("Không tìm thấy dự án", 404);
      }

      if (dbError.message?.includes("Forbidden") || dbError.message?.includes("Không có quyền")) {
        throw new AppError("Bạn không có quyền xóa dự án này", 403);
      }

      if (
        dbError.message?.includes("Cannot delete project because it still has tasks") ||
        dbError.message?.includes("Không thể xóa project vì vẫn còn nhiệm vụ") ||
        dbError.message?.includes("Không thể xóa Project vì vẫn còn Task")
      ) {
        throw new AppError(
          "Không thể xóa dự án vì vẫn còn nhiệm vụ. Vui lòng xóa nhiệm vụ trước.",
          409
        );
      }

      if (
        dbError.message?.includes("Cannot delete project because it still has boards") ||
        dbError.message?.includes("Không thể xóa project vì vẫn còn board") ||
        dbError.message?.includes("Không thể xóa Project vì vẫn còn Board")
      ) {
        throw new AppError(
          "Không thể xóa dự án vì vẫn còn bảng. Vui lòng xóa bảng trước.",
          409
        );
      }

      throw error;
    }
  },

  async getMembers(projectId: number, userId: number): Promise<ProjectMemberItem[]> {
    if (!projectId || Number.isNaN(projectId)) {
      throw new AppError("ID dự án không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("projectId", sql.Int, projectId)
        .input("userId", sql.Int, userId)
        .execute("sp_ProjectMember_GetByProject");

      return (result.recordset ?? []) as ProjectMemberItem[];
    } catch (error: unknown) {
      mapProjectMemberError(error, "xem thành viên dự án");
      throw error;
    }
  },

  async addMember(input: AddProjectMemberInput): Promise<ProjectMemberItem> {
    if (!input.projectId || Number.isNaN(input.projectId)) {
      throw new AppError("ID dự án không hợp lệ", 400);
    }

    const email = input.email?.trim().toLowerCase();
    if (!email) {
      throw new AppError("Email thành viên là bắt buộc", 400);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new AppError("Email không hợp lệ", 400);
    }

    if (!input.role || !["Admin", "Member"].includes(input.role)) {
      throw new AppError("Role không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("projectId", sql.Int, input.projectId)
        .input("email", sql.NVarChar(255), email)
        .input("role", sql.NVarChar(50), input.role)
        .input("userId", sql.Int, input.userId)
        .execute("sp_ProjectMember_Add");

      const member = result.recordset?.[0] as ProjectMemberItem | undefined;

      if (!member) {
        throw new AppError("Thêm thành viên dự án thất bại", 500);
      }

      return member;
    } catch (error: unknown) {
      mapProjectMemberError(error, "thêm thành viên vào dự án");
      throw error;
    }
  },

  async updateMemberRole(input: UpdateProjectMemberRoleInput): Promise<ProjectMemberItem> {
    if (!input.projectId || Number.isNaN(input.projectId)) {
      throw new AppError("ID dự án không hợp lệ", 400);
    }

    if (!input.memberUserId || Number.isNaN(input.memberUserId)) {
      throw new AppError("ID thành viên không hợp lệ", 400);
    }

    if (!input.role || !["Admin", "Member"].includes(input.role)) {
      throw new AppError("Role không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("projectId", sql.Int, input.projectId)
        .input("memberUserId", sql.Int, input.memberUserId)
        .input("role", sql.NVarChar(50), input.role)
        .input("userId", sql.Int, input.userId)
        .execute("sp_ProjectMember_UpdateRole");

      const member = result.recordset?.[0] as ProjectMemberItem | undefined;

      if (!member) {
        throw new AppError("Cập nhật quyền thành viên dự án thất bại", 500);
      }

      return member;
    } catch (error: unknown) {
      mapProjectMemberError(error, "cập nhật quyền thành viên dự án");
      throw error;
    }
  },

  async removeMember(input: RemoveProjectMemberInput): Promise<{ message: string }> {
    if (!input.projectId || Number.isNaN(input.projectId)) {
      throw new AppError("ID dự án không hợp lệ", 400);
    }

    if (!input.memberUserId || Number.isNaN(input.memberUserId)) {
      throw new AppError("ID thành viên không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("projectId", sql.Int, input.projectId)
        .input("memberUserId", sql.Int, input.memberUserId)
        .input("userId", sql.Int, input.userId)
        .execute("sp_ProjectMember_Remove");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;
      return { message: message ?? "Xóa thành viên khỏi dự án thành công" };
    } catch (error: unknown) {
      mapProjectMemberError(error, "xóa thành viên khỏi dự án");
      throw error;
    }
  }
};
