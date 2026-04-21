import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface TaskItem {
  taskId: number;
  listId: number;
  title: string;
  label: string | null;
  description: string | null;
  dueDate: Date | null;
  priority: string | null;
  status: string | null;
  position: number;
}

interface TaskDetail {
  taskId: number;
  listId: number;
  title: string;
  label: string | null;
  description: string | null;
  dueDate: Date | null;
  priority: string | null;
  status: string | null;
  position: number;
  createdAt: Date;
  updatedAt: Date | null;
  assignees: Array<{
    userId: number;
    fullName: string;
  }>;
  checklist: Array<{
    id: number;
    content: string;
    isCompleted: boolean;
    position: number;
  }>;
  attachments: Array<{
    attachmentId: number;
    fileName: string | null;
    fileUrl: string | null;
    createdAt: Date;
  }>;
  comments: Array<{
    commentId: number;
    content: string;
    userId: number;
    fullName: string;
    createdAt: Date;
  }>;
  activity: Array<{
    activityId: number;
    action: string | null;
    userId: number;
    fullName: string;
    createdAt: Date;
  }>;
}

interface CreateTaskInput {
  title: string;
  label?: string;
  listId: number;
  userId: number;
}

interface MoveTaskInput {
  taskId: number;
  targetListId: number;
  position?: number;
  userId: number;
}

interface UpdateTaskInput {
  taskId: number;
  title?: string;
  label?: string | null;
  description?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  userId: number;
}

const mapTaskError = (error: unknown, action: "truy cập" | "tạo" | "di chuyển" | "cập nhật" | "xóa"): never => {
  const dbError = error as { message?: string };

  if (
    dbError.message?.includes("Không tìm thấy Task") ||
    dbError.message?.includes("Task not found")
  ) {
    throw new AppError("Không tìm thấy nhiệm vụ", 404);
  }

  if (
    dbError.message?.includes("Không tìm thấy List") ||
    dbError.message?.includes("List not found")
  ) {
    throw new AppError("Không tìm thấy danh sách nhiệm vụ", 404);
  }

  if (dbError.message?.includes("Không tìm thấy List đích")) {
    throw new AppError("Không tìm thấy danh sách nhiệm vụ đích", 404);
  }

  if (
    dbError.message?.includes("Không có quyền") ||
    dbError.message?.includes("Forbidden")
  ) {
    throw new AppError(`Bạn không có quyền ${action} nhiệm vụ này`, 403);
  }

  if (dbError.message?.includes("Không có dữ liệu để cập nhật")) {
    throw new AppError("Không có dữ liệu để cập nhật nhiệm vụ", 400);
  }

  if (dbError.message?.includes("Chỉ hỗ trợ di chuyển Task trong cùng Board")) {
    throw new AppError("Chỉ hỗ trợ di chuyển nhiệm vụ trong cùng bảng", 400);
  }

  throw error;
};

export const tasksService = {
  async getDetail(taskId: number, userId: number): Promise<TaskDetail> {
    if (!taskId || Number.isNaN(taskId)) {
      throw new AppError("ID nhiệm vụ không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, taskId)
        .input("userId", sql.Int, userId)
        .execute("sp_Task_GetDetail_Json");

      const jsonPayload = (result.recordset?.[0] as { data?: unknown } | undefined)?.data;

      if (!jsonPayload) {
        throw new AppError("Không tìm thấy nhiệm vụ", 404);
      }

      const parsed = typeof jsonPayload === "string"
        ? (JSON.parse(jsonPayload) as TaskDetail)
        : (jsonPayload as TaskDetail);

      if (!parsed?.taskId) {
        throw new AppError("Không tìm thấy nhiệm vụ", 404);
      }

      return parsed;
    } catch (error: unknown) {
      mapTaskError(error, "truy cập");
      throw error;
    }
  },

  async create(input: CreateTaskInput): Promise<TaskItem> {
    const title = input.title?.trim();
    const label = input.label?.trim() || null;

    if (!title) {
      throw new AppError("Tiêu đề nhiệm vụ là bắt buộc", 400);
    }

    if (title.length < 2) {
      throw new AppError("Tiêu đề nhiệm vụ cần ít nhất 2 ký tự", 400);
    }

    if (!input.listId || Number.isNaN(input.listId)) {
      throw new AppError("ID danh sách nhiệm vụ không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("title", sql.NVarChar(255), title)
        .input("label", sql.NVarChar(100), label)
        .input("listId", sql.Int, input.listId)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Task_Create");

      const task = result.recordset?.[0] as TaskItem | undefined;

      if (!task) {
        throw new AppError("Tạo nhiệm vụ thất bại", 500);
      }

      return task;
    } catch (error: unknown) {
      mapTaskError(error, "tạo");
      throw error;
    }
  },

  async move(input: MoveTaskInput): Promise<TaskItem> {
    if (!input.taskId || Number.isNaN(input.taskId)) {
      throw new AppError("ID nhiệm vụ không hợp lệ", 400);
    }

    if (!input.targetListId || Number.isNaN(input.targetListId)) {
      throw new AppError("ID danh sách nhiệm vụ đích không hợp lệ", 400);
    }

    if (input.position !== undefined && (Number.isNaN(input.position) || input.position < 1)) {
      throw new AppError("Vị trí di chuyển không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("targetListId", sql.Int, input.targetListId)
        .input("position", sql.Int, input.position ?? 1)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Task_Move");

      const task = result.recordset?.[0] as TaskItem | undefined;

      if (!task) {
        throw new AppError("Di chuyển nhiệm vụ thất bại", 500);
      }

      return task;
    } catch (error: unknown) {
      mapTaskError(error, "di chuyển");
      throw error;
    }
  },

  async update(input: UpdateTaskInput): Promise<TaskItem> {
    if (!input.taskId || Number.isNaN(input.taskId)) {
      throw new AppError("ID nhiệm vụ không hợp lệ", 400);
    }

    const title = input.title?.trim();
    const clearLabel = input.label === null;
    const label = input.label === undefined || input.label === null
      ? null
      : input.label.trim();

    if (input.title !== undefined && !title) {
      throw new AppError("Tiêu đề nhiệm vụ không hợp lệ", 400);
    }

    if (
      !title
      && !label
      && !clearLabel
      && !input.description
      && !input.dueDate
      && !input.priority
      && !input.status
    ) {
      throw new AppError("Không có dữ liệu để cập nhật nhiệm vụ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("title", sql.NVarChar(255), title ?? null)
        .input("label", sql.NVarChar(100), label)
        .input("clearLabel", sql.Bit, clearLabel ? 1 : 0)
        .input("description", sql.NVarChar(sql.MAX), input.description?.trim() || null)
        .input("dueDate", sql.DateTime, input.dueDate ? new Date(input.dueDate) : null)
        .input("priority", sql.NVarChar(50), input.priority?.trim() || null)
        .input("status", sql.NVarChar(50), input.status?.trim() || null)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Task_Update");

      const task = result.recordset?.[0] as TaskItem | undefined;

      if (!task) {
        throw new AppError("Cập nhật nhiệm vụ thất bại", 500);
      }

      return task;
    } catch (error: unknown) {
      mapTaskError(error, "cập nhật");
      throw error;
    }
  },

  async remove(taskId: number, userId: number): Promise<{ message: string }> {
    if (!taskId || Number.isNaN(taskId)) {
      throw new AppError("ID nhiệm vụ không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, taskId)
        .input("userId", sql.Int, userId)
        .execute("sp_Task_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;

      return {
        message: message ?? "Đã xóa nhiệm vụ thành công."
      };
    } catch (error: unknown) {
      mapTaskError(error, "xóa");
      throw error;
    }
  }
};
