import sql from "mssql";
import { getDBPool } from "../config/db";
import { generateAccessToken } from "../utils/jwt";

interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

interface LoginInput {
  email: string;
  password: string;
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
    throw new AppError("Email, password and fullName are required", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters", 400);
  }

  if (fullName.trim().length < 2) {
    throw new AppError("Full name must be at least 2 characters", 400);
  }
};

const validateLoginInput = ({ email, password }: LoginInput): void => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format", 400);
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

      return { message: "Register successful" };
    } catch (error: unknown) {
      const dbError = error as { number?: number; originalError?: { info?: { number?: number } } };
      const sqlErrorNumber = dbError.number ?? dbError.originalError?.info?.number;

      if (sqlErrorNumber === 2627 || sqlErrorNumber === 2601) {
        throw new AppError("Email already exists", 409);
      }

      throw new AppError("Register failed", 500);
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
      throw new AppError("Invalid email or password", 401);
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
  }
};

export { AppError };
