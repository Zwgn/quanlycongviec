export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
};

export type LoginData = {
  accessToken: string;
  user: {
    userId: number;
    email: string;
    fullName: string;
  };
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? 'http://localhost:3001/api';

const normalizeFetchError = (error: unknown): Error => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('load failed')) {
      return new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng hoặc thử lại sau.');
    }
    return error;
  }

  return new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
};

const parseResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  let body: ApiResponse<T> | null = null;

  try {
    body = (await response.json()) as ApiResponse<T>;
  } catch (_error) {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message ?? 'Yêu cầu thất bại. Vui lòng thử lại.');
  }

  if (!body) {
    throw new Error('Phản hồi từ server không hợp lệ.');
  }

  return body;
};

export const register = async (payload: RegisterPayload): Promise<string> => {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw normalizeFetchError(error);
  }

  const body = await parseResponse<undefined>(response);
  return body.message;
};

export const login = async (payload: LoginPayload): Promise<LoginData> => {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw normalizeFetchError(error);
  }

  const body = await parseResponse<LoginData>(response);

  if (!body.data) {
    throw new Error('Không nhận được dữ liệu đăng nhập từ server.');
  }

  return body.data;
};

export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<string> => {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    throw normalizeFetchError(error);
  }

  const body = await parseResponse<undefined>(response);
  return body.message;
};
