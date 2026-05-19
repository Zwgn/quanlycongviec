import { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import { register } from '../services/auth.service';

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
};

type UseRegisterPageParams = {
  onNavigateLogin: () => void;
};

// Hook quản lý trang đăng ký và kiểm tra dữ liệu đầu vào.
export const useRegisterPage = ({ onNavigateLogin }: UseRegisterPageParams) => {
  const [values, setValues] = useState<RegisterValues>({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh sách điểm nổi bật hiển thị ở form đăng ký.
  const highlights = useMemo(
    () => ['Tạo không gian nhanh', 'Giao việc dễ dàng', 'Theo dõi trực quan'],
    []
  );

  // Xử lý thay đổi input đăng ký.
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

  // Gửi form đăng ký và chuyển sang đăng nhập khi thành công.
  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!values.fullName.trim()) {
      nextErrors.fullName = 'Vui lòng nhập họ và tên.';
    }

    if (!values.email.trim()) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!emailRegex.test(values.email)) {
      nextErrors.email = 'Email không đúng định dạng.';
    }

    if (values.password.trim().length < 6) {
      nextErrors.password = 'Mật khẩu cần ít nhất 6 ký tự.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSubmitSuccess('');

      const message = await register(values);
      setSubmitSuccess(message || 'Đăng ký thành công. Vui lòng đăng nhập.');
      onNavigateLogin();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Đăng ký thất bại. Vui lòng thử lại.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    highlights,
    values,
    errors,
    submitError,
    submitSuccess,
    isSubmitting,
    onInputChange,
    onSubmit,
  };
};
