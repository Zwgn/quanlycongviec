import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { forgotPassword, login } from '../services/auth.service';

type LoginValues = {
  email: string;
  password: string;
};

type UseLoginPageParams = {
  onLoginSuccess: () => void;
};

// Hook quản lý trang đăng nhập và xử lý quên mật khẩu.
export const useLoginPage = ({ onLoginSuccess }: UseLoginPageParams) => {
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [isSendingForgot, setIsSendingForgot] = useState(false);

  // Danh sách lợi ích hiển thị ở form đăng nhập.
  const benefits = useMemo(
    () => ['Quản lý bảng, nhiệm vụ tập trung', 'Phân công công việc rõ ràng', 'Cộng tác theo thời gian thực'],
    []
  );

  // Xử lý thay đổi input đăng nhập.
  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }

    if (submitError) {
      setSubmitError('');
    }
  };

  // Gửi form đăng nhập và lưu token người dùng.
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!emailRegex.test(values.email)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }

    if (!values.password.trim()) {
      nextErrors.password = 'Vui lòng nhập mật khẩu.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const result = await login(values);
      localStorage.setItem('taskflow_access_token', result.accessToken);
      localStorage.setItem('taskflow_user', JSON.stringify(result.user));

      setSubmitSuccess('Đăng nhập thành công.');
      onLoginSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng nhập thất bại. Vui lòng thử lại.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mở modal quên mật khẩu và đồng bộ email.
  const handleForgotPassword = () => {
    setForgotEmail(values.email.trim());
    setForgotError('');
    setForgotSuccess('');
    setIsForgotModalOpen(true);
  };

  // Đóng modal quên mật khẩu và reset trạng thái.
  const handleCloseForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotError('');
    setForgotSuccess('');
    setIsSendingForgot(false);
  };

  // Cập nhật email trong modal quên mật khẩu.
  const handleForgotEmailChange = (value: string) => {
    setForgotEmail(value);
    if (forgotError) {
      setForgotError('');
    }
    if (forgotSuccess) {
      setForgotSuccess('');
    }
  };

  // Gửi yêu cầu quên mật khẩu (thông báo giả lập).
  const handleForgotSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = forgotEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!normalizedEmail) {
      setForgotError('Vui lòng nhập email.');
      setForgotSuccess('');
      return;
    }

    if (!emailRegex.test(normalizedEmail)) {
      setForgotError('Email không đúng định dạng.');
      setForgotSuccess('');
      return;
    }

    try {
      setIsSendingForgot(true);
      setForgotError('');
      setForgotSuccess('');
      const message = await forgotPassword({ email: normalizedEmail });
      setForgotSuccess(message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      setForgotError(message);
    } finally {
      setIsSendingForgot(false);
    }
  };

  return {
    benefits,
    values,
    errors,
    submitError,
    submitSuccess,
    isSubmitting,
    isForgotModalOpen,
    forgotEmail,
    forgotError,
    forgotSuccess,
    isSendingForgot,
    onInputChange,
    onSubmit,
    handleForgotPassword,
    handleCloseForgotModal,
    handleForgotEmailChange,
    handleForgotSubmit,
  };
};
