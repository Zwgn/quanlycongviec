import {
  API_BASE_URL,
  getAuthHeaders,
  getResponseMessage,
  handleAuthExpired,
  parseJsonBody,
  parseRawOrWrappedData,
} from './api';
import { ApiResponse, BoardData, CreatedList } from './types';

export const getBoardData = async (boardId: number): Promise<BoardData> => {
  const response = await fetch(`${API_BASE_URL}/boards/${boardId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return parseRawOrWrappedData<BoardData>(response);
};

export const createList = async (input: { name: string; boardId: number }): Promise<CreatedList> => {
  const response = await fetch(`${API_BASE_URL}/lists`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(input),
  });

  return parseRawOrWrappedData<CreatedList>(response);
};

export const deleteList = async (listId: number): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/lists/${listId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  const body = (await parseJsonBody(response)) as ApiResponse<null> | null;

  if (!response.ok) {
    if (response.status === 401) {
      handleAuthExpired();
      throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
    }
    throw new Error(getResponseMessage(body, 'Không thể xóa danh sách nhiệm vụ.'));
  }

  return getResponseMessage(body, 'Đã xóa danh sách nhiệm vụ thành công.');
};
