import {
  API_BASE_URL,
  getAuthHeaders,
  getResponseMessage,
  handleAuthExpired,
  parseData,
  parseJsonBody,
} from './api';
import { CurrentUser } from './types';

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseData<CurrentUser>(response);
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/users/change-password`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const body = await parseJsonBody(response);

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Đổi mật khẩu thất bại.'));
  }

  return getResponseMessage(body, 'Đổi mật khẩu thành công.');
};
