import jwt from "jsonwebtoken";

export interface AccessTokenPayload {
  userId: number;
  email: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Thiếu biến môi trường bắt buộc: JWT_SECRET");
  }
  return secret;
};

export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "24h" });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as AccessTokenPayload;
};
