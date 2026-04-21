import { ApiResponse } from './types';

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:3001/api';
export const AUTH_EXPIRED_EVENT = 'taskflow:auth-expired';

export const handleAuthExpired = () => {
  localStorage.removeItem('taskflow_access_token');
  localStorage.removeItem('taskflow_user');
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
};

export const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('taskflow_access_token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const parseJsonBody = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch (_error) {
    return null;
  }
};

export const getResponseMessage = (body: unknown, fallback: string): string => {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export const parseData = async <T>(response: Response): Promise<T> => {
  const body = (await parseJsonBody(response)) as ApiResponse<T> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Yêu cầu thất bại.'));
  }

  if (!body || !body.data) {
    throw new Error('Phản hồi không có dữ liệu.');
  }

  return body.data;
};

export const parseRawOrWrappedData = async <T>(response: Response): Promise<T> => {
  const body = await parseJsonBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Yêu cầu thất bại.'));
  }

  if (!body) {
    throw new Error('Phản hồi không hợp lệ.');
  }

  if (typeof body === 'object' && 'data' in body) {
    const wrapped = body as ApiResponse<T>;
    if (!wrapped.data) {
      throw new Error('Phản hồi không có dữ liệu.');
    }
    return wrapped.data;
  }

  return body as T;
};
