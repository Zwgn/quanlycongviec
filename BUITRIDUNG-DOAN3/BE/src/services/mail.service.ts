import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST?.trim();
const smtpPort = Number(process.env.SMTP_PORT ?? '587');
const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;
const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: smtpUser,
    pass: smtpPass
  }
});

export const sendNewPasswordEmail = async (email: string, newPassword: string): Promise<void> => {
  try {
    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error('SMTP chưa được cấu hình. Vui lòng thiết lập SMTP_HOST, SMTP_USER và SMTP_PASS.');
    }

    await transporter.sendMail({
      from: '"Hệ thống quản lý TaskFlow" <TaskFlow@gmail.com>',
      to: email,
      subject: 'Mật khẩu mới TaskFlow',
      html: `
        <h2>Mật khẩu mới của bạn</h2>
        <p>Bạn đã yêu cầu reset mật khẩu. Đây là mật khẩu mới của bạn:</p>
        <h3 style="color: #007bff; font-size: 18px; letter-spacing: 1px; background: #f0f0f0; padding: 10px; border-radius: 5px;">${newPassword}</h3>
        <p><strong>Vui lòng:</strong></p>
        <ul>
          <li>Giữ bí mật mật khẩu này</li>
          <li>Đổi mật khẩu thành một mật khẩu mạnh của riêng bạn sau khi đăng nhập</li>
        </ul>
        <p>Nếu bạn không yêu cầu reset mật khẩu, vui lòng liên hệ với quản trị viên ngay.</p>
      `
    });
  } catch (error) {
    console.error('Gửi email mật khẩu mới thất bại:', error);
    throw error;
  }
};