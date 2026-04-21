import { API_BASE_URL, getAuthHeaders, parseData } from './api';
import { CurrentUser } from './types';

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseData<CurrentUser>(response);
};
