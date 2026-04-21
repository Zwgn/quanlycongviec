import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface CreateListInput {
  name: string;
  boardId: number;
  userId: number;
}

interface ListItem {
  listId: number;
  boardId: number;
  name: string;
  position: number;
}

const mapListError = (
  error: unknown,
  action: "tạo" | "xóa"
): never => {
  const dbError = error as { message?: string };

  if (
    dbError.message?.includes("Không tìm thấy Board") ||
    dbError.message?.includes("Board not found")
  ) {
    throw new AppError("Không tìm thấy bảng", 404);
  }

  if (
    dbError.message?.includes("Không tìm thấy List") ||
    dbError.message?.includes("List not found")
  ) {
    throw new AppError("Không tìm thấy danh sách nhiệm vụ", 404);
  }

  if (
    dbError.message?.includes("Không có quyền") ||
    dbError.message?.includes("Forbidden")
  ) {
    throw new AppError(`Bạn không có quyền ${action} danh sách nhiệm vụ này`, 403);
  }

  throw error;
};

const ensureBoardByProjectId = async (
  pool: sql.ConnectionPool,
  projectId: number,
  userId: number
): Promise<number> => {
  const projectExistsResult = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .query("SELECT TOP 1 projectId FROM Project WHERE projectId = @projectId");

  if (!projectExistsResult.recordset?.[0]) {
    throw new AppError("Không tìm thấy bảng", 404);
  }

  const permissionResult = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .input("userId", sql.Int, userId)
    .query(`
      SELECT TOP 1 p.projectId, p.name
      FROM Project p
      INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
      LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
      WHERE p.projectId = @projectId
        AND (w.ownerId = @userId OR wm.userId = @userId)
    `);

  const project = permissionResult.recordset?.[0] as
    | { projectId: number; name: string }
    | undefined;

  if (!project) {
    throw new AppError("Bạn không có quyền tạo danh sách nhiệm vụ trong bảng này", 403);
  }

  const existingBoardResult = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .query(`
      SELECT TOP 1 boardId
      FROM Board
      WHERE projectId = @projectId
      ORDER BY createdAt ASC, boardId ASC
    `);

  const existingBoard = existingBoardResult.recordset?.[0] as
    | { boardId: number }
    | undefined;

  if (existingBoard?.boardId) {
    return existingBoard.boardId;
  }

  const createdBoardResult = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .input("name", sql.NVarChar(255), project.name)
    .query(`
      INSERT INTO Board (projectId, name)
      OUTPUT INSERTED.boardId
      VALUES (@projectId, @name)
    `);

  const createdBoard = createdBoardResult.recordset?.[0] as
    | { boardId: number }
    | undefined;

  if (!createdBoard?.boardId) {
    throw new AppError("Không thể tạo bảng mặc định", 500);
  }

  return createdBoard.boardId;
};

export const listsService = {
  async create(input: CreateListInput): Promise<ListItem> {
    const name = input.name?.trim();

    if (!name) {
      throw new AppError("Tên danh sách nhiệm vụ là bắt buộc", 400);
    }

    if (name.length < 2) {
      throw new AppError("Tên danh sách nhiệm vụ cần ít nhất 2 ký tự", 400);
    }

    if (!input.boardId || Number.isNaN(input.boardId)) {
      throw new AppError("ID bảng không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("name", sql.NVarChar(255), name)
        .input("boardId", sql.Int, input.boardId)
        .input("userId", sql.Int, input.userId)
        .execute("sp_List_Create");

      const list = result.recordset?.[0] as ListItem | undefined;

      if (!list) {
        throw new AppError("Tạo danh sách nhiệm vụ thất bại", 500);
      }

      return list;
    } catch (error: unknown) {
      const dbError = error as { message?: string };

      if (dbError.message?.includes("Không tìm thấy Board") || dbError.message?.includes("Không tìm thấy bảng")) {
        const resolvedBoardId = await ensureBoardByProjectId(pool, input.boardId, input.userId);

        const retried = await pool
          .request()
          .input("name", sql.NVarChar(255), name)
          .input("boardId", sql.Int, resolvedBoardId)
          .input("userId", sql.Int, input.userId)
          .execute("sp_List_Create");

        const retriedList = retried.recordset?.[0] as ListItem | undefined;

        if (!retriedList) {
          throw new AppError("Tạo danh sách nhiệm vụ thất bại", 500);
        }

        return retriedList;
      }

      mapListError(error, "tạo");
      throw error;
    }
  },

  async remove(listId: number, userId: number): Promise<{ message: string }> {
    if (!listId || Number.isNaN(listId)) {
      throw new AppError("ID danh sách nhiệm vụ không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("listId", sql.Int, listId)
        .input("userId", sql.Int, userId)
        .execute("sp_List_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;

      return {
        message: message ?? "Đã xóa danh sách nhiệm vụ thành công."
      };
    } catch (error: unknown) {
      mapListError(error, "xóa");
      throw error;
    }
  }
};
