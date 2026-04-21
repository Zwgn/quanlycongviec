export type WorkspaceRole = 'Owner' | 'Admin' | 'Member';

export type Workspace = {
  workspaceId: number;
  name: string;
  role: WorkspaceRole;
};

export type WorkspaceMember = {
  userId: number;
  fullName: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
};

export type ProjectMember = {
  userId: number;
  fullName: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: string;
};

export type Project = {
  projectId: number;
  workspaceId?: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CurrentUser = {
  userId: number;
  fullName: string;
  email: string;
};

export type BoardTask = {
  taskId: number;
  title: string;
  position: number;
};

export type BoardList = {
  listId: number;
  name: string;
  tasks: BoardTask[];
};

export type BoardData = {
  boardId: number;
  name: string;
  lists: BoardList[];
};

export type CreatedList = {
  listId: number;
  boardId: number;
  name: string;
  position: number;
};

export type CreatedTask = {
  taskId: number;
  listId: number;
  title: string;
  label?: string | null;
  description?: string | null;
  dueDate?: string | null;
  priority?: string | null;
  status?: string | null;
  position: number;
};

export type TaskDetailResponse = {
  taskId: number;
  listId: number;
  title: string;
  label: string | null;
  description: string | null;
  dueDate: string | null;
  priority: string | null;
  status: string | null;
  position: number;
  createdAt: string;
  updatedAt: string | null;
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
    createdAt: string;
  }>;
  comments: Array<{
    commentId: number;
    content: string;
    userId: number;
    fullName: string;
    createdAt: string;
  }>;
  activity: Array<{
    activityId: number;
    action: string | null;
    userId: number;
    fullName: string;
    createdAt: string;
  }>;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
};
