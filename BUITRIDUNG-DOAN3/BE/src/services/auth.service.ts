import sql from "mssql";
import { getDBPool } from "../config/db";
import { generateAccessToken } from "../utils/jwt";
import { sendNewPasswordEmail } from "./mail.service";

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
}

interface ForgotPasswordInput {
  email: string;
}

interface DbUser {
  userId: number;
  email: string;
  password: string;
  fullName: string;
}

interface LoginResponse {
  accessToken: string;
  user: {
    userId: number;
    email: string;
    fullName: string;
  };
}

class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegisterInput = ({ email, password, fullName }: RegisterInput): void => {
  if (!email || !password || !fullName) {
    throw new AppError("Email, mật khẩu và họ tên là bắt buộc", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Email không đúng định dạng", 400);
  }

  if (password.length < 6) {
    throw new AppError("Mật khẩu phải có ít nhất 6 ký tự", 400);
  }

  if (fullName.trim().length < 2) {
    throw new AppError("Họ tên phải có ít nhất 2 ký tự", 400);
  }
};

const validateLoginInput = ({ email, password }: LoginInput): void => {
  if (!email || !password) {
    throw new AppError("Email và mật khẩu là bắt buộc", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Email không đúng định dạng", 400);
  }
};

export const authService = {
  async register(input: RegisterInput): Promise<{ message: string }> {
    validateRegisterInput(input);

    const pool = await getDBPool();

    try {
      await pool
        .request()
        .input("email", sql.NVarChar(255), input.email)
        .input("password", sql.NVarChar(255), input.password)
        .input("fullName", sql.NVarChar(255), input.fullName)
        .execute("sp_User_Register");

      return { message: "Đăng ký thành công" };
    } catch (error: unknown) {
      const dbError = error as { number?: number; originalError?: { info?: { number?: number } } };
      const sqlErrorNumber = dbError.number ?? dbError.originalError?.info?.number;

      if (sqlErrorNumber === 2627 || sqlErrorNumber === 2601) {
        throw new AppError("Email đã tồn tại", 409);
      }

      throw new AppError("Đăng ký thất bại", 500);
    }
  },

  async login(input: LoginInput): Promise<LoginResponse> {
    validateLoginInput(input);

    const pool = await getDBPool();
    const result = await pool
      .request()
      .input("email", sql.NVarChar(255), input.email)
      .input("password", sql.NVarChar(255), input.password)
      .execute("sp_User_Login");

    const user = result.recordset?.[0] as DbUser | undefined;

    if (!user) {
      throw new AppError("Email hoặc mật khẩu không đúng", 401);
    }

    const accessToken = generateAccessToken({
      userId: user.userId,
      email: user.email
    });

    return {
      accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName
      }
    };
  },

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const normalizedEmail = input.email?.trim().toLowerCase();

    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw new AppError("Email không đúng định dạng", 400);
    }

    const pool = await getDBPool();

    try {
      // Check if user exists
      const userResult = await pool
        .request()
        .input("email", sql.NVarChar(255), normalizedEmail)
        .query("SELECT userId FROM [User] WHERE email = @email");

      if (!userResult.recordset || userResult.recordset.length === 0) {
        throw new AppError("Không tìm thấy email", 404);
      }

      // Generate new random password (8 characters)
      const newPassword = Math.random().toString(36).substring(2, 10);

      // Update password in database
      await pool
        .request()
        .input("email", sql.NVarChar(255), normalizedEmail)
        .input("password", sql.NVarChar(255), newPassword)
        .query("UPDATE [User] SET password = @password WHERE email = @email");

      // Send email with new password
      await sendNewPasswordEmail(normalizedEmail, newPassword);

      return { message: "Mật khẩu mới đã được gửi về email" };
    } catch (error: unknown) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Không thể xử lý yêu cầu quên mật khẩu", 500);
    }
  }
}
export { AppError };
