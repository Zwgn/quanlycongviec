import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface BoardRecord {
  boardId: number;
  name: string;
}

interface ListRecord {
  listId: number;
  name: string;
  position: number;
}

interface TaskRecord {
  taskId: number;
  listId: number;
  title: string;
  position: number;
}

export interface BoardTask {
  taskId: number;
  title: string;
  position: number;
}

export interface BoardList {
  listId: number;
  name: string;
  tasks: BoardTask[];
}

export interface BoardData {
  boardId: number;
  name: string;
  lists: BoardList[];
}

interface BoardContext {
  boardId: number | null;
  projectId: number;
  workspaceId: number;
  projectName: string;
}

const parseBoardData = (result: unknown): BoardData => {
  const recordsets = Array.isArray((result as { recordsets?: unknown }).recordsets)
    ? ((result as { recordsets: unknown[] }).recordsets)
    : [];

  const boardRows = ((recordsets[0] as BoardRecord[] | undefined) ?? []);
  const listRows = ((recordsets[1] as ListRecord[] | undefined) ?? []);
  const taskRows = ((recordsets[2] as TaskRecord[] | undefined) ?? []);

  const board = boardRows[0];

  if (!board) {
    throw new AppError("Không tìm thấy Board", 404);
  }

  const lists = listRows
    .sort((a, b) => a.position - b.position)
    .map((list) => ({
      listId: list.listId,
      name: list.name,
      tasks: taskRows
        .filter((task) => task.listId === list.listId)
        .sort((a, b) => a.position - b.position)
        .map((task) => ({
          taskId: task.taskId,
          title: task.title,
          position: task.position
        }))
    }));

  return {
    boardId: board.boardId,
    name: board.name,
    lists
  };
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
    throw new AppError("Không tìm thấy Board", 404);
  }

  const permissionResult = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .input("userId", sql.Int, userId)
    .query(`
      SELECT TOP 1 p.projectId, p.name
      FROM Project p
      INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
      LEFT JOIN ProjectMember pm
        ON pm.projectId = p.projectId
       AND pm.userId = @userId
      WHERE p.projectId = @projectId
        AND (w.ownerId = @userId OR pm.userId = @userId)
    `);

  const project = permissionResult.recordset?.[0] as
    | { projectId: number; name: string }
    | undefined;

  if (!project) {
    throw new AppError("Bạn không có quyền truy cập Board này", 403);
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
    throw new AppError("Không thể tạo Board mặc định", 500);
  }

  return createdBoard.boardId;
};

const resolveBoardContext = async (
  pool: sql.ConnectionPool,
  boardOrProjectId: number
): Promise<BoardContext | null> => {
  const boardResult = await pool
    .request()
    .input("boardId", sql.Int, boardOrProjectId)
    .query(`
      SELECT TOP 1
        b.boardId,
        p.projectId,
        p.workspaceId,
        p.name AS projectName
      FROM Board b
      INNER JOIN Project p ON p.projectId = b.projectId
      WHERE b.boardId = @boardId
    `);

  const boardRow = boardResult.recordset?.[0] as
    | { boardId: number; projectId: number; workspaceId: number; projectName: string }
    | undefined;

  if (boardRow) {
    return {
      boardId: boardRow.boardId,
      projectId: boardRow.projectId,
      workspaceId: boardRow.workspaceId,
      projectName: boardRow.projectName
    };
  }

  const projectResult = await pool
    .request()
    .input("projectId", sql.Int, boardOrProjectId)
    .query(`
      SELECT TOP 1
        p.projectId,
        p.workspaceId,
        p.name AS projectName
      FROM Project p
      WHERE p.projectId = @projectId
    `);

  const projectRow = projectResult.recordset?.[0] as
    | { projectId: number; workspaceId: number; projectName: string }
    | undefined;

  if (!projectRow) {
    return null;
  }

  return {
    boardId: null,
    projectId: projectRow.projectId,
    workspaceId: projectRow.workspaceId,
    projectName: projectRow.projectName
  };
};

const ensureProjectMembership = async (
  pool: sql.ConnectionPool,
  projectId: number,
  userId: number
): Promise<void> => {
  const permissionResult = await pool
    .request()
    .input("projectId", sql.Int, projectId)
    .input("userId", sql.Int, userId)
    .query(`
      SELECT TOP 1 p.projectId
      FROM Project p
      INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
      LEFT JOIN ProjectMember pm
        ON pm.projectId = p.projectId
       AND pm.userId = @userId
      WHERE p.projectId = @projectId
        AND (w.ownerId = @userId OR pm.userId = @userId)
    `);

  if (!permissionResult.recordset?.[0]) {
    throw new AppError("Bạn không có quyền truy cập Board này", 403);
  }
};

const readBoardDataByQueries = async (
  pool: sql.ConnectionPool,
  boardOrProjectId: number,
  userId: number
): Promise<BoardData> => {
  const context = await resolveBoardContext(pool, boardOrProjectId);

  if (!context) {
    throw new AppError("Không tìm thấy Board", 404);
  }

  await ensureProjectMembership(pool, context.projectId, userId);

  const resolvedBoardId = context.boardId
    ?? (await ensureBoardByProjectId(pool, context.projectId, userId));

  const boardResult = await pool
    .request()
    .input("boardId", sql.Int, resolvedBoardId)
    .query(`
      SELECT TOP 1
        b.boardId,
        b.name
      FROM Board b
      WHERE b.boardId = @boardId
    `);

  const board = boardResult.recordset?.[0] as { boardId: number; name: string } | undefined;

  if (!board) {
    throw new AppError("Không tìm thấy Board", 404);
  }

  const listResult = await pool
    .request()
    .input("boardId", sql.Int, resolvedBoardId)
    .query(`
      SELECT
        l.listId,
        l.name,
        l.position
      FROM [List] l
      WHERE l.boardId = @boardId
      ORDER BY l.position ASC, l.listId ASC
    `);

  const taskResult = await pool
    .request()
    .input("boardId", sql.Int, resolvedBoardId)
    .query(`
      SELECT
        t.taskId,
        t.listId,
        t.title,
        ISNULL(t.position, 0) AS position
      FROM Task t
      INNER JOIN [List] l ON l.listId = t.listId
      WHERE l.boardId = @boardId
      ORDER BY t.listId ASC, t.position ASC, t.taskId ASC
    `);

  const listRows = (listResult.recordset ?? []) as ListRecord[];
  const taskRows = (taskResult.recordset ?? []) as TaskRecord[];

  return {
    boardId: board.boardId,
    name: board.name,
    lists: listRows.map((list) => ({
      listId: list.listId,
      name: list.name,
      tasks: taskRows
        .filter((task) => task.listId === list.listId)
        .map((task) => ({
          taskId: task.taskId,
          title: task.title,
          position: task.position
        }))
    }))
  };
};

export const boardsService = {
  async getBoardData(boardId: number, userId: number): Promise<BoardData> {
    if (!boardId || Number.isNaN(boardId)) {
      throw new AppError("ID Board không hợp lệ", 400);
    }

    const pool = await getDBPool();

    try {
      const result = await pool
        .request()
        .input("boardId", sql.Int, boardId)
        .input("userId", sql.Int, userId)
        .execute("sp_Board_GetDetail");

      return parseBoardData(result);
    } catch (error: unknown) {
      const dbError = error as { message?: string };

      if (dbError.message?.includes("Không tìm thấy Board")) {
        const resolvedBoardId = await ensureBoardByProjectId(pool, boardId, userId);

        const retried = await pool
          .request()
          .input("boardId", sql.Int, resolvedBoardId)
          .input("userId", sql.Int, userId)
          .execute("sp_Board_GetDetail");

        return parseBoardData(retried);
      }

      if (dbError.message?.includes("Không có quyền") || dbError.message?.includes("Forbidden")) {
        return readBoardDataByQueries(pool, boardId, userId);
      }

      throw error;
    }
  }
};
