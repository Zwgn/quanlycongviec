import {
  API_BASE_URL,
  getAuthHeaders,
  getResponseMessage,
  handleAuthExpired,
  parseJsonBody,
  parseRawOrWrappedData,
} from './api';
import { ApiResponse, CreatedTask, TaskDetailResponse } from './types';

export const createTask = async (input: { title: string; listId: number }): Promise<CreatedTask> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData<CreatedTask>(response);
};

export const moveTask = async (
  taskId: number,
  input: { targetListId: number; position?: number }
): Promise<CreatedTask> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/move`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData<CreatedTask>(response);
};

export const getTaskDetail = async (taskId: number): Promise<TaskDetailResponse> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseRawOrWrappedData<TaskDetailResponse>(response);
};

export const updateTask = async (
  taskId: number,
  input: {
    title?: string;
    label?: string | null;
    description?: string;
    dueDate?: string | null;
    priority?: string;
    status?: string;
  }
): Promise<CreatedTask> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData<CreatedTask>(response);
};

export const deleteTask = async (taskId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa nhiệm vụ.'));
  }

  return getResponseMessage(body, 'Đã xóa nhiệm vụ thành công.');
};

export const createChecklistItem = async (input: {
  taskId: number;
  content: string;
  position?: number;
}): Promise<{
  id: number;
  taskId: number;
  content: string;
  isCompleted: boolean;
  position: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/checklist-items`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData(response);
};

export const toggleChecklistItem = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/checklist-items/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  return parseRawOrWrappedData(response);
};

export const moveChecklistItem = async (
  id: number,
  input: { position: number }
): Promise<{
  id: number;
  taskId: number;
  content: string;
  isCompleted: boolean;
  position: number;
}> => {
  const response = await fetch(`${API_BASE_URL}/checklist-items/${id}/move`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData(response);
};

export const deleteChecklistItem = async (id: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/checklist-items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa mục kiểm tra.'));
  }

  return getResponseMessage(body, 'Đã xóa mục kiểm tra thành công.');
};

export const createComment = async (input: { taskId: number; content: string }) => {
  const response = await fetch(`${API_BASE_URL}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData(response);
};

export const deleteComment = async (commentId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa bình luận.'));
  }

  return getResponseMessage(body, 'Đã xóa bình luận thành công.');
};

export const createAttachment = async (input: {
  taskId: number;
  fileName?: string;
  fileUrl: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/attachments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData(response);
};

export const deleteAttachment = async (attachmentId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa file đính kèm.'));
  }

  return getResponseMessage(body, 'Đã xóa tệp đính kèm thành công.');
};

export const addTaskAssignee = async (input: {
  taskId: number;
  assigneeUserId: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/task-assignees`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData(response);
};

export const removeTaskAssignee = async (
  input: {
    taskId: number;
    assigneeUserId: number;
  }
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/task-assignees`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa người được giao.'));
  }

  return getResponseMessage(body, 'Đã xóa người được giao thành công.');
};
