import React, { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import AuthForm, { AuthField } from '../../components/auth/AuthForm';
import AuthShell from '../../components/auth/AuthShell';
import { register } from '../../services/auth.service';

type RegisterPageProps = {
  onNavigateLogin: () => void;
  onNavigateLanding: () => void;
};

type RegisterValues = {
  fullName: string;
  email: string;
  password: string;
};

const registerFields: AuthField[] = [
  {
    name: 'fullName',
    label: 'Họ và tên',
    type: 'text',
    placeholder: 'Nguyen Van A',
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'you@company.com',
  },
  {
    name: 'password',
    label: 'Mật khẩu',
    type: 'password',
    placeholder: 'Tối thiểu 6 ký tự',
  },
];

function RegisterPage({ onNavigateLogin, onNavigateLanding }: RegisterPageProps) {
  const [values, setValues] = useState<RegisterValues>({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const highlights = useMemo(
    () => ['Tạo không gian nhanh', 'Giao việc dễ dàng', 'Theo dõi trực quan'],
    []
  );

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

  return (
    <AuthShell
      variant="login"
      tag="TaskFlow"
      title="Bắt đầu công việc mà bạn yêu thích"
      description="Tạo không gian làm việc, mời đội nhóm và quản lý dự án tất cả trong một nền tảng mạch lạc."
      highlights={highlights}
    >
      <AuthForm
        variant="login"
        title="Đăng ký"
        subtitle=""
        fields={registerFields}
        values={values}
        errors={errors}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitSuccess={submitSuccess}
        submitLabel="Tạo tài khoản"
        switchText="Bạn đã có tài khoản?"
        switchActionLabel="Đăng nhập"
        onSwitchAction={onNavigateLogin}
        onBackHome={onNavigateLanding}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </AuthShell>
  );
}

export default RegisterPage;
