import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface ChecklistItem {
  id: number;
  taskId: number;
  content: string;
  isCompleted: boolean;
  position: number;
}

interface CommentItem {
  commentId: number;
  taskId: number;
  userId: number;
  fullName: string;
  content: string;
  createdAt: Date;
}

interface AttachmentItem {
  attachmentId: number;
  taskId: number;
  fileName: string | null;
  fileUrl: string | null;
  createdAt: Date;
}

interface ActivityItem {
  activityId: number;
  taskId: number;
  userId: number;
  fullName: string;
  action: string | null;
  createdAt: Date;
}

interface TaskAssigneeItem {
  id: number;
  taskId: number;
  userId: number;
  fullName: string;
  assignedAt: Date;
}

interface CreateChecklistItemInput {
  taskId: number;
  content: string;
  position?: number;
  userId: number;
}

interface UpdateChecklistItemInput {
  id: number;
  content: string;
  userId: number;
}

interface MoveChecklistItemInput {
  id: number;
  position: number;
  userId: number;
}

interface CreateCommentInput {
  taskId: number;
  content: string;
  userId: number;
}

interface CreateAttachmentInput {
  taskId: number;
  fileName?: string;
  fileUrl: string;
  userId: number;
}

interface AddTaskAssigneeInput {
  taskId: number;
  assigneeUserId: number;
  userId: number;
}

interface RemoveTaskAssigneeInput {
  taskId: number;
  assigneeUserId: number;
  userId: number;
}

const mapTaskDetailError = (
  error: unknown,
  action: string
): never => {
  const dbError = error as { message?: string };

  if (dbError.message?.includes("Không tìm thấy Task")) {
    throw new AppError("Không tìm thấy Task", 404);
  }

  if (dbError.message?.includes("Không tìm thấy ChecklistItem")) {
    throw new AppError("Không tìm thấy ChecklistItem", 404);
  }

  if (dbError.message?.includes("Không tìm thấy Comment")) {
    throw new AppError("Không tìm thấy Comment", 404);
  }

  if (dbError.message?.includes("Không tìm thấy Attachment")) {
    throw new AppError("Không tìm thấy Attachment", 404);
  }

  if (dbError.message?.includes("Không tìm thấy User được gán")) {
    throw new AppError("Không tìm thấy User được gán", 404);
  }

  if (dbError.message?.includes("Không có quyền") || dbError.message?.includes("Forbidden")) {
    throw new AppError(`Bạn không có quyền ${action}`, 403);
  }

  if (
    dbError.message?.includes("không được rỗng") ||
    dbError.message?.includes("không thuộc Workspace")
  ) {
    throw new AppError(dbError.message, 400);
  }

  if (dbError.message?.includes("đã được gán vào Task")) {
    throw new AppError("User đã được gán vào Task", 409);
  }

  throw error;
};

const ensureValidId = (value: number, message: string): void => {
  if (!value || Number.isNaN(value) || value < 1) {
    throw new AppError(message, 400);
  }
};

export const taskDetailService = {
  async createChecklistItem(input: CreateChecklistItemInput): Promise<ChecklistItem> {
    const content = input.content?.trim();

    ensureValidId(input.taskId, "ID Task không hợp lệ");

    if (!content) {
      throw new AppError("Nội dung checklist không được rỗng", 400);
    }

    if (input.position !== undefined && (Number.isNaN(input.position) || input.position < 1)) {
      throw new AppError("Vị trí checklist không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("content", sql.NVarChar(sql.MAX), content)
        .input("position", sql.Int, input.position ?? null)
        .input("userId", sql.Int, input.userId)
        .execute("sp_ChecklistItem_Create");

      const item = result.recordset?.[0] as ChecklistItem | undefined;

      if (item) {
        return item;
      }

      const fallbackItemLookup = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("content", sql.NVarChar(sql.MAX), content)
        .query(`
          SELECT TOP 1
            id,
            taskId,
            content,
            isCompleted,
            position
          FROM ChecklistItem
          WHERE taskId = @taskId
            AND LTRIM(RTRIM(content)) = LTRIM(RTRIM(@content))
          ORDER BY id DESC
        `);

      const fallbackItem = fallbackItemLookup.recordset?.[0] as ChecklistItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Tạo checklist item thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "tạo checklist item");
      throw error;
    }
  },

  async updateChecklistItem(input: UpdateChecklistItemInput): Promise<ChecklistItem> {
    const content = input.content?.trim();

    ensureValidId(input.id, "ID ChecklistItem không hợp lệ");

    if (!content) {
      throw new AppError("Nội dung checklist không được rỗng", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("id", sql.Int, input.id)
        .input("content", sql.NVarChar(sql.MAX), content)
        .input("userId", sql.Int, input.userId)
        .execute("sp_ChecklistItem_Update");

      const item = result.recordset?.[0] as ChecklistItem | undefined;

      if (item) {
        return item;
      }

      const fallbackItemLookup = await pool
        .request()
        .input("id", sql.Int, input.id)
        .query(`
          SELECT
            id,
            taskId,
            content,
            isCompleted,
            position
          FROM ChecklistItem
          WHERE id = @id
        `);

      const fallbackItem = fallbackItemLookup.recordset?.[0] as ChecklistItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Cập nhật checklist item thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "cập nhật checklist item");
      throw error;
    }
  },

  async toggleChecklistItem(id: number, userId: number): Promise<ChecklistItem> {
    ensureValidId(id, "ID ChecklistItem không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("userId", sql.Int, userId)
        .execute("sp_ChecklistItem_Toggle");

      const item = result.recordset?.[0] as ChecklistItem | undefined;

      if (item) {
        return item;
      }

      const fallbackItemLookup = await pool
        .request()
        .input("id", sql.Int, id)
        .query(`
          SELECT
            id,
            taskId,
            content,
            isCompleted,
            position
          FROM ChecklistItem
          WHERE id = @id
        `);

      const fallbackItem = fallbackItemLookup.recordset?.[0] as ChecklistItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Toggle checklist item thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "toggle checklist item");
      throw error;
    }
  },

  async moveChecklistItem(input: MoveChecklistItemInput): Promise<ChecklistItem> {
    ensureValidId(input.id, "ID ChecklistItem không hợp lệ");

    if (Number.isNaN(input.position) || input.position < 1) {
      throw new AppError("Vị trí checklist không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("id", sql.Int, input.id)
        .input("position", sql.Int, input.position)
        .input("userId", sql.Int, input.userId)
        .execute("sp_ChecklistItem_Move");

      const item = result.recordset?.[0] as ChecklistItem | undefined;

      if (item) {
        return item;
      }

      const fallbackItemLookup = await pool
        .request()
        .input("id", sql.Int, input.id)
        .query(`
          SELECT
            id,
            taskId,
            content,
            isCompleted,
            position
          FROM ChecklistItem
          WHERE id = @id
        `);

      const fallbackItem = fallbackItemLookup.recordset?.[0] as ChecklistItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Di chuyển checklist item thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "di chuyển checklist item");
      throw error;
    }
  },

  async deleteChecklistItem(id: number, userId: number): Promise<{ message: string }> {
    ensureValidId(id, "ID ChecklistItem không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("id", sql.Int, id)
        .input("userId", sql.Int, userId)
        .execute("sp_ChecklistItem_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;

      return {
        message: message ?? "Đã xóa mục kiểm tra thành công."
      };
    } catch (error: unknown) {
      mapTaskDetailError(error, "xóa checklist item");
      throw error;
    }
  },

  async getCommentsByTask(taskId: number, userId: number): Promise<CommentItem[]> {
    ensureValidId(taskId, "ID Task không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, taskId)
        .input("userId", sql.Int, userId)
        .execute("sp_Comment_GetByTask");

      return (result.recordset ?? []) as CommentItem[];
    } catch (error: unknown) {
      mapTaskDetailError(error, "xem bình luận của Task");
      throw error;
    }
  },

  async createComment(input: CreateCommentInput): Promise<CommentItem> {
    const content = input.content?.trim();

    ensureValidId(input.taskId, "ID Task không hợp lệ");

    if (!content) {
      throw new AppError("Nội dung bình luận không được rỗng", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("content", sql.NVarChar(sql.MAX), content)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Comment_Create");

      const item = result.recordset?.[0] as CommentItem | undefined;

      if (item) {
        return item;
      }

      const fallbackItemLookup = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("userId", sql.Int, input.userId)
        .input("content", sql.NVarChar(sql.MAX), content)
        .query(`
          SELECT TOP 1
            c.commentId,
            c.taskId,
            c.userId,
            u.fullName,
            c.content,
            c.createdAt
          FROM Comment c
          INNER JOIN [User] u ON u.userId = c.userId
          WHERE c.taskId = @taskId
            AND c.userId = @userId
            AND LTRIM(RTRIM(c.content)) = LTRIM(RTRIM(@content))
          ORDER BY c.commentId DESC
        `);

      const fallbackItem = fallbackItemLookup.recordset?.[0] as CommentItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Tạo comment thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "tạo bình luận");
      throw error;
    }
  },

  async deleteComment(commentId: number, userId: number): Promise<{ message: string }> {
    ensureValidId(commentId, "ID Comment không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("commentId", sql.Int, commentId)
        .input("userId", sql.Int, userId)
        .execute("sp_Comment_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;

      return {
        message: message ?? "Đã xóa bình luận thành công."
      };
    } catch (error: unknown) {
      mapTaskDetailError(error, "xóa bình luận");
      throw error;
    }
  },

  async getAttachmentsByTask(taskId: number, userId: number): Promise<AttachmentItem[]> {
    ensureValidId(taskId, "ID Task không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, taskId)
        .input("userId", sql.Int, userId)
        .execute("sp_Attachment_GetByTask");

      return (result.recordset ?? []) as AttachmentItem[];
    } catch (error: unknown) {
      mapTaskDetailError(error, "xem file đính kèm của Task");
      throw error;
    }
  },

  async createAttachment(input: CreateAttachmentInput): Promise<AttachmentItem> {
    ensureValidId(input.taskId, "ID Task không hợp lệ");

    const fileUrl = input.fileUrl?.trim();
    const fileName = input.fileName?.trim();

    if (!fileUrl) {
      throw new AppError("File URL không được rỗng", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("fileName", sql.NVarChar(255), fileName ?? null)
        .input("fileUrl", sql.NVarChar(500), fileUrl)
        .input("userId", sql.Int, input.userId)
        .execute("sp_Attachment_Create");

      const item = result.recordset?.[0] as AttachmentItem | undefined;

      if (item) {
        return item;
      }

      // Some DB environments return no recordset from the procedure even when insert succeeds.
      const fallbackLookup = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("fileUrl", sql.NVarChar(500), fileUrl)
        .query(`
          SELECT TOP 1
            attachmentId,
            taskId,
            fileName,
            fileUrl,
            createdAt
          FROM Attachment
          WHERE taskId = @taskId
            AND LTRIM(RTRIM(fileUrl)) = LTRIM(RTRIM(@fileUrl))
          ORDER BY attachmentId DESC
        `);

      const fallbackItem = fallbackLookup.recordset?.[0] as AttachmentItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Tạo attachment thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "tạo file đính kèm");
      throw error;
    }
  },

  async deleteAttachment(attachmentId: number, userId: number): Promise<{ message: string }> {
    ensureValidId(attachmentId, "ID Attachment không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("attachmentId", sql.Int, attachmentId)
        .input("userId", sql.Int, userId)
        .execute("sp_Attachment_Delete");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;

      return {
        message: message ?? "Đã xóa tệp đính kèm thành công."
      };
    } catch (error: unknown) {
      mapTaskDetailError(error, "xóa file đính kèm");
      throw error;
    }
  },

  async getActivityByTask(taskId: number, userId: number): Promise<ActivityItem[]> {
    ensureValidId(taskId, "ID Task không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, taskId)
        .input("userId", sql.Int, userId)
        .execute("sp_Activity_GetByTask");

      return (result.recordset ?? []) as ActivityItem[];
    } catch (error: unknown) {
      mapTaskDetailError(error, "xem activity của Task");
      throw error;
    }
  },

  async getTaskAssigneesByTask(taskId: number, userId: number): Promise<TaskAssigneeItem[]> {
    ensureValidId(taskId, "ID Task không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, taskId)
        .input("userId", sql.Int, userId)
        .execute("sp_TaskAssignee_GetByTask");

      return (result.recordset ?? []) as TaskAssigneeItem[];
    } catch (error: unknown) {
      mapTaskDetailError(error, "xem assignee của Task");
      throw error;
    }
  },

  async addTaskAssignee(input: AddTaskAssigneeInput): Promise<TaskAssigneeItem> {
    ensureValidId(input.taskId, "ID Task không hợp lệ");
    ensureValidId(input.assigneeUserId, "ID User gán không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("assigneeUserId", sql.Int, input.assigneeUserId)
        .input("userId", sql.Int, input.userId)
        .execute("sp_TaskAssignee_Add");

      const item = result.recordset?.[0] as TaskAssigneeItem | undefined;

      if (item) {
        return item;
      }

      const fallbackItemLookup = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("assigneeUserId", sql.Int, input.assigneeUserId)
        .query(`
          SELECT TOP 1
            ta.id,
            ta.taskId,
            ta.userId,
            u.fullName,
            ta.assignedAt
          FROM TaskAssignee ta
          INNER JOIN [User] u ON u.userId = ta.userId
          WHERE ta.taskId = @taskId
            AND ta.userId = @assigneeUserId
          ORDER BY ta.id DESC
        `);

      const fallbackItem = fallbackItemLookup.recordset?.[0] as TaskAssigneeItem | undefined;

      if (!fallbackItem) {
        throw new AppError("Thêm assignee thất bại", 500);
      }

      return fallbackItem;
    } catch (error: unknown) {
      mapTaskDetailError(error, "thêm assignee");
      throw error;
    }
  },

  async removeTaskAssignee(input: RemoveTaskAssigneeInput): Promise<{ message: string }> {
    ensureValidId(input.taskId, "ID Task không hợp lệ");
    ensureValidId(input.assigneeUserId, "ID User gán không hợp lệ");

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("taskId", sql.Int, input.taskId)
        .input("assigneeUserId", sql.Int, input.assigneeUserId)
        .input("userId", sql.Int, input.userId)
        .execute("sp_TaskAssignee_Remove");

      const message = (result.recordset?.[0] as { message?: string } | undefined)?.message;

      return {
        message: message ?? "Đã xóa người được giao thành công."
      };
    } catch (error: unknown) {
      mapTaskDetailError(error, "xóa assignee");
      throw error;
    }
  }
};
