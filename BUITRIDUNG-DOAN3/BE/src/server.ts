import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

const port = Number(process.env.PORT ?? 3001);

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    app.listen(port, () => {
      console.log(`Máy chủ đang chạy trên cổng ${port}`);
    });
  } catch (error) {
    console.error("Khởi động máy chủ thất bại:", error);
    process.exit(1);
  }
};

void startServer();
