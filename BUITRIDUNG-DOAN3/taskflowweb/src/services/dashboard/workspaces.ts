import {
  API_BASE_URL,
  getAuthHeaders,
  getResponseMessage,
  handleAuthExpired,
  parseData,
  parseJsonBody,
} from './api';
import { ApiResponse, Workspace, WorkspaceMember } from './types';

export const getUserWorkspaces = async (): Promise<Workspace[]> => {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseData<Workspace[]>(response);
};

export const getWorkspaceMembers = async (workspaceId: number): Promise<WorkspaceMember[]> => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseData<WorkspaceMember[]>(response);
};

export const addWorkspaceMember = async (
  workspaceId: number,
  input: { email: string; role: 'Admin' | 'Member' }
): Promise<WorkspaceMember> => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseData<WorkspaceMember>(response);
};

export const updateWorkspaceMemberRole = async (
  workspaceId: number,
  memberUserId: number,
  input: { role: 'Admin' | 'Member' }
): Promise<WorkspaceMember> => {
  const response = await fetch(
    `${API_BASE_URL}/workspaces/${workspaceId}/members/${memberUserId}/role`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(input),
    }
  );

  return parseData<WorkspaceMember>(response);
};

export const removeWorkspaceMember = async (
  workspaceId: number,
  memberUserId: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/members/${memberUserId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa thành viên.'));
  }

  return getResponseMessage(body, 'Đã xóa thành viên thành công.');
};

export const createWorkspace = async (name: string): Promise<Workspace> => {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ name }),
  });

  return parseData<Workspace>(response);
};
