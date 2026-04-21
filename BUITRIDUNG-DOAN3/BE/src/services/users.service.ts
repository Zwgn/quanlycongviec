import sql from "mssql";
import { getDBPool } from "../config/db";
import { AppError } from "./auth.service";

interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
}

export const usersService = {
  async getMe(userId: number): Promise<UserProfile> {
    if (!userId || Number.isNaN(userId)) {
      throw new AppError("Invalid user id", 400);
    }

    const pool = await getDBPool();
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .execute("sp_User_GetMe");

    const user = result.recordset?.[0] as UserProfile | undefined;

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }
};
