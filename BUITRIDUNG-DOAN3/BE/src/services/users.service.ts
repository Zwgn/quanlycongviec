import sql from "mssql";
import { getDBPool } from "../config/db";
import { comparePassword } from "../utils/hash";
import { AppError } from "./auth.service";

interface UserProfile {
  userId: number;
  fullName: string;
  email: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export const usersService = {
  async getMe(userId: number): Promise<UserProfile> {
    if (!userId || Number.isNaN(userId)) {
      throw new AppError("ID người dùng không hợp lệ", 400);
    }

    const pool = await getDBPool();
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .execute("sp_User_GetMe");

    const user = result.recordset?.[0] as UserProfile | undefined;

    if (!user) {
      throw new AppError("Không tìm thấy người dùng", 404);
    }

    return user;
  },

  async changePassword(userId: number, input: ChangePasswordInput): Promise<{ message: string }> {
    if (!userId || Number.isNaN(userId)) {
      throw new AppError("ID người dùng không hợp lệ", 400);
    }

    const currentPassword = input.currentPassword?.trim();
    const newPassword = input.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      throw new AppError("Vui lòng nhập đầy đủ mật khẩu", 400);
    }

    if (newPassword.length < 6) {
      throw new AppError("Mật khẩu mới phải có ít nhất 6 ký tự", 400);
    }

    if (currentPassword === newPassword) {
      throw new AppError("Mật khẩu mới phải khác mật khẩu cũ", 400);
    }

    const pool = await getDBPool();
    const userResult = await pool
      .request()
      .input("userId", sql.Int, userId)
      .query("SELECT password FROM [User] WHERE userId = @userId");

    const user = userResult.recordset?.[0] as { password?: string } | undefined;

    if (!user?.password) {
      throw new AppError("Không tìm thấy người dùng", 404);
    }

    if (!comparePassword(currentPassword, user.password)) {
      throw new AppError("Mật khẩu cũ không đúng", 400);
    }

    await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("password", sql.NVarChar(255), newPassword)
      .query("UPDATE [User] SET password = @password WHERE userId = @userId");

    return { message: "Đổi mật khẩu thành công" };
  }
};
