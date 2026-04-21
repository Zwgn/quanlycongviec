import React, { ChangeEvent, FormEvent, useMemo, useState } from 'react';
import AuthForm, { AuthField } from '../../components/auth/AuthForm';
import AuthShell from '../../components/auth/AuthShell';
import { login } from '../../services/auth.service';

type LoginPageProps = {
  onNavigateRegister: () => void;
  onNavigateLanding: () => void;
  onLoginSuccess: () => void;
};

type LoginValues = {
  email: string;
  password: string;
};

const loginFields: AuthField[] = [
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
    placeholder: 'Nhập mật khẩu của bạn',
  },
];

function LoginPage({ onNavigateRegister, onNavigateLanding, onLoginSuccess }: LoginPageProps) {
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

  const benefits = useMemo(
    () => ['Quản lý bảng, nhiệm vụ tập trung', 'Phân công công việc rõ ràng', 'Cộng tác theo thời gian thực'],
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

  const handleForgotPassword = () => {
    setForgotEmail(values.email.trim());
    setForgotError('');
    setForgotSuccess('');
    setIsForgotModalOpen(true);
  };

  const handleCloseForgotModal = () => {
    setIsForgotModalOpen(false);
    setForgotError('');
    setForgotSuccess('');
    setIsSendingForgot(false);
  };

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

      setForgotSuccess(
        'Nếu email tồn tại trong hệ thống, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu trong vài phút tới.'
      );
    } finally {
      setIsSendingForgot(false);
    }
  };

  return (
    <AuthShell
      variant="login"
      tag="TaskFlow"
      title="Trở lại với công việc"
      description="Quản lý dự án, nhiệm vụ và cộng tác với đội nhóm dễ dàng hơn."
      highlights={benefits}
    >
      <>
        <AuthForm
          variant="login"
          title="Đăng nhập"
          subtitle=""
          fields={loginFields}
          values={values}
          errors={errors}
          isSubmitting={isSubmitting}
          submitError={submitError}
          submitSuccess={submitSuccess}
          submitLabel="Đăng nhập"
          forgotPasswordLabel="Quên mật khẩu?"
          onForgotPassword={handleForgotPassword}
          switchText="Bạn chưa có tài khoản?"
          switchActionLabel="Đăng ký ngay"
          onSwitchAction={onNavigateRegister}
          onBackHome={onNavigateLanding}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
        />

        {isForgotModalOpen ? (
          <div
            className="auth-forgot-modal-overlay"
            role="presentation"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                handleCloseForgotModal();
              }
            }}
          >
            <div className="auth-forgot-modal" role="dialog" aria-modal="true" aria-label="Quên mật khẩu">
              <button
                type="button"
                className="auth-forgot-close"
                aria-label="Đóng hộp thoại quên mật khẩu"
                onClick={handleCloseForgotModal}
              >
                x
              </button>

              <form className="auth-forgot-form" onSubmit={handleForgotSubmit} noValidate>
                <label className="auth-forgot-input-wrap" htmlFor="forgotPasswordEmail">
                  <span className="auth-forgot-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
                      <rect x="3" y="5" width="18" height="14" rx="1.8" stroke="currentColor" strokeWidth="2" />
                      <path
                        d="M4.5 7 12 13l7.5-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <input
                    id="forgotPasswordEmail"
                    type="email"
                    placeholder="Email"
                    value={forgotEmail}
                    onChange={(event) => {
                      setForgotEmail(event.target.value);
                      if (forgotError) {
                        setForgotError('');
                      }
                      if (forgotSuccess) {
                        setForgotSuccess('');
                      }
                    }}
                    autoFocus
                  />
                </label>

                {forgotError ? <p className="auth-forgot-feedback auth-forgot-feedback--error">{forgotError}</p> : null}
                {forgotSuccess ? (
                  <p className="auth-forgot-feedback auth-forgot-feedback--success">{forgotSuccess}</p>
                ) : null}

                <button type="submit" className="auth-forgot-submit" disabled={isSendingForgot}>
                  {isSendingForgot ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </>
    </AuthShell>
  );
}

export default LoginPage;
