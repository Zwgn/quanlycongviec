import {
  API_BASE_URL,
  getAuthHeaders,
  getResponseMessage,
  parseData,
  parseJsonBody,
  handleAuthExpired,
} from './api';
import { ApiResponse, Project, ProjectMember } from './types';

export const getProjectsByWorkspace = async (workspaceId: number): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/projects?workspaceId=${workspaceId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseData<Project[]>(response);
};

export const getProjectMembers = async (projectId: number): Promise<ProjectMember[]> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseData<ProjectMember[]>(response);
};

export const addProjectMember = async (
  projectId: number,
  input: { email: string; role: 'Admin' | 'Member' }
): Promise<ProjectMember> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseData<ProjectMember>(response);
};

export const updateProjectMemberRole = async (
  projectId: number,
  memberUserId: number,
  input: { role: 'Admin' | 'Member' }
): Promise<ProjectMember> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members/${memberUserId}/role`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseData<ProjectMember>(response);
};

export const removeProjectMember = async (
  projectId: number,
  memberUserId: number
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/members/${memberUserId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa thành viên dự án.'));
  }

  return getResponseMessage(body, 'Đã xóa thành viên dự án thành công.');
};

export const createProject = async (input: {
  workspaceId: number;
  name: string;
  description?: string;
}): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseData<Project>(response);
};

export const updateProject = async (
  projectId: number,
  input: { name: string; description?: string }
): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseData<Project>(response);
};

export const deleteProject = async (projectId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa dự án.'));
  }

  return getResponseMessage(body, 'Đã xóa dự án thành công.');
};
