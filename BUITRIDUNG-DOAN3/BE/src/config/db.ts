import sql from "mssql";

const getRequiredEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Thiếu biến môi trường bắt buộc: ${key}`);
  }
  return value;
};

const dbConfig: sql.config = {
  user: getRequiredEnv("DB_USER"),
  password: getRequiredEnv("DB_PASSWORD"),
  server: getRequiredEnv("DB_SERVER"),
  database: getRequiredEnv("DB_NAME"),
  port: Number(process.env.DB_PORT ?? 1433),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    useUTC: false
  }
};

let pool: sql.ConnectionPool | null = null;

export const connectDB = async (): Promise<sql.ConnectionPool> => {
  if (pool) {
    return pool;
  }

  pool = await new sql.ConnectionPool(dbConfig).connect();
  return pool;
};

export const getDBPool = async (): Promise<sql.ConnectionPool> => {
  return connectDB();
};
