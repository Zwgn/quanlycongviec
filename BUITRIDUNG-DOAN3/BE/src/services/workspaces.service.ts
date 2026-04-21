import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface WorkspaceItem {
  workspaceId: number;
  name: string;
  role: "Owner" | "Admin" | "Member";
}

interface CreateWorkspaceInput {
  name: string;
  ownerId: number;
}

interface UpdateWorkspaceInput {
  workspaceId: number;
  name: string;
  description?: string;
  userId: number;
}

interface AddWorkspaceMemberInput {
  workspaceId: number;
  email: string;
  role: "Admin" | "Member";
  userId: number;
}

interface UpdateWorkspaceMemberRoleInput {
  workspaceId: number;
  memberUserId: number;
  role: "Admin" | "Member";
  userId: number;
}

interface RemoveWorkspaceMemberInput {
  workspaceId: number;
  memberUserId: number;
  userId: number;
}

interface WorkspaceMemberItem {
  userId: number;
  fullName: string;
  email: string;
  role: "Owner" | "Admin" | "Member";
  joinedAt: Date;
}

const mapWorkspaceError = (error: unknown, action: string): never => {
  const dbError = error as { message?: string };

  if (dbError.message?.includes("Không có quyền") || dbError.message?.includes("Forbidden")) {
    throw new AppError(`Bạn không có quyền ${action}`, 403);
  }

  if (dbError.message?.includes("Không tìm thấy Workspace")) {
    throw new AppError("Không tìm thấy Workspace", 404);
  }

  if (dbError.message?.includes("Không tìm thấy thành viên")) {
    throw new AppError("Không tìm thấy thành viên trong Workspace", 404);
  }

  if (dbError.message?.includes("Không tìm thấy người dùng")) {
    throw new AppError("Không tìm thấy người dùng", 404);
  }

  if (dbError.message?.includes("Role không hợp lệ")) {
    throw new AppError("Role không hợp lệ", 400);
  }

  if (
    dbError.message?.includes("chỉ có thể") ||
    dbError.message?.includes("Không thể thay đổi quyền") ||
    dbError.message?.includes("Không thể xóa Owner") ||
    dbError.message?.includes("đã là thành viên") ||
    dbError.message?.includes("đã là Owner") ||
    dbError.message?.includes("Không thể xóa Workspace vì vẫn còn Project")
  ) {
    throw new AppError(dbError.message ?? "Yêu cầu không hợp lệ", 409);
  }

  throw error;
};

export const workspacesService = {
  async getByUser(userId: number): Promise<WorkspaceItem[]> {
    if (!userId || Number.isNaN(userId)) {
      throw new AppError("ID người dùng không hợp lệ", 400);
    }

    const pool = await getDBPool();
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .execute("sp_Workspace_GetByUser");

    return (result.recordset ?? []) as WorkspaceItem[];
  },

  async create(input: CreateWorkspaceInput): Promise<WorkspaceItem> {
    const name = input.name?.trim();

    if (!name) {
      throw new AppError("Tên Workspace là bắt buộc", 400);
    }

    if (name.length < 2) {
      throw new AppError("Tên Workspace cần ít nhất 2 ký tự", 400);
    }

    if (!input.ownerId || Number.isNaN(input.ownerId)) {
      throw new AppError("ID chủ sở hữu không hợp lệ", 400);
    }

    const pool = await getDBPool();
    const result = await pool
      .request()
      .input("name", sql.NVarChar(255), name)
      .input("ownerId", sql.Int, input.ownerId)
      .execute("sp_Workspace_Create");

    const workspace = result.recordset?.[0] as WorkspaceItem | undefined;

    if (!workspace) {
      throw new AppError("Tạo Workspace thất bại", 500);
    }

    return workspace;
  },

  async update(input: UpdateWorkspaceInput): Promise<{
    workspaceId: number;
    name: string;
    description: string | null;
    ownerId: number;
    createdAt: Date;
  }> {
    const name = input.name?.trim();

    if (!input.workspaceId || Number.isNaN(input.workspaceId)) {
      throw new AppError("ID Workspace không hợp lệ", 400);
    }

    if (!name) {
      throw new AppError("Tên Workspace là bắt buộc", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("workspaceId", sql.Int, input.workspaceId)
        .input("name", sql.NVarChar(255), name)
        .input("description", sql.NVarChar(sql.MAX), input.description?.trim() || null)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Workspace_Update");

      const workspace = result.recordset?.[0] as {
        workspaceId: number;
        name: string;
        description: string | null;
        ownerId: number;
        createdAt: Date;
      } | undefined;

      if (!workspace) {
        throw new AppError("Cập nhật Workspace thất bại", 500);
      }

      return workspace;
    } catch (error: unknown) {
      mapWorkspaceError(error, "cập nhật Workspace");
      throw error;
    }
  },

  async remove(workspaceId: number, userId: number): Promise<{ message: string }> {
    if (!workspaceId || Number.isNaN(workspaceId)) {
      throw new AppError("ID Workspace không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("workspaceId", sql.Int, workspaceId)
        .input("userId", sql.Int, userId)
        .execute("sp_Workspace_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;
      return { message: message ?? "Xóa Workspace thành công" };
    } catch (error: unknown) {
      mapWorkspaceError(error, "xóa Workspace");
      throw error;
    }
  },

  async getMembers(workspaceId: number, userId: number): Promise<WorkspaceMemberItem[]> {
    if (!workspaceId || Number.isNaN(workspaceId)) {
      throw new AppError("ID Workspace không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("workspaceId", sql.Int, workspaceId)
        .input("userId", sql.Int, userId)
        .execute("sp_WorkspaceMember_GetByWorkspace");

      return (result.recordset ?? []) as WorkspaceMemberItem[];
    } catch (error: unknown) {
      mapWorkspaceError(error, "xem danh sách thành viên Workspace");
      throw error;
    }
  },

  async addMember(input: AddWorkspaceMemberInput): Promise<WorkspaceMemberItem> {
    if (!input.workspaceId || Number.isNaN(input.workspaceId)) {
      throw new AppError("ID Workspace không hợp lệ", 400);
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
        .input("workspaceId", sql.Int, input.workspaceId)
        .input("email", sql.NVarChar(255), email)
        .input("role", sql.NVarChar(50), input.role)
        .input("userId", sql.Int, input.userId)
        .execute("sp_WorkspaceMember_Add");

      const member = result.recordset?.[0] as WorkspaceMemberItem | undefined;

      if (!member) {
        throw new AppError("Thêm thành viên thất bại", 500);
      }

      return member;
    } catch (error: unknown) {
      mapWorkspaceError(error, "thêm thành viên vào Workspace");
      throw error;
    }
  },

  async updateMemberRole(input: UpdateWorkspaceMemberRoleInput): Promise<WorkspaceMemberItem> {
    if (!input.workspaceId || Number.isNaN(input.workspaceId)) {
      throw new AppError("ID Workspace không hợp lệ", 400);
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
        .input("workspaceId", sql.Int, input.workspaceId)
        .input("memberUserId", sql.Int, input.memberUserId)
        .input("role", sql.NVarChar(50), input.role)
        .input("userId", sql.Int, input.userId)
        .execute("sp_WorkspaceMember_UpdateRole");

      const member = result.recordset?.[0] as WorkspaceMemberItem | undefined;

      if (!member) {
        throw new AppError("Cập nhật quyền thành viên thất bại", 500);
      }

      return member;
    } catch (error: unknown) {
      mapWorkspaceError(error, "cập nhật quyền thành viên Workspace");
      throw error;
    }
  },

  async removeMember(input: RemoveWorkspaceMemberInput): Promise<{ message: string }> {
    if (!input.workspaceId || Number.isNaN(input.workspaceId)) {
      throw new AppError("ID Workspace không hợp lệ", 400);
    }

    if (!input.memberUserId || Number.isNaN(input.memberUserId)) {
      throw new AppError("ID thành viên không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("workspaceId", sql.Int, input.workspaceId)
        .input("memberUserId", sql.Int, input.memberUserId)
        .input("userId", sql.Int, input.userId)
        .execute("sp_WorkspaceMember_Remove");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;
      return { message: message ?? "Xóa thành viên thành công" };
    } catch (error: unknown) {
      mapWorkspaceError(error, "xóa thành viên khỏi Workspace");
      throw error;
    }
  }
};
