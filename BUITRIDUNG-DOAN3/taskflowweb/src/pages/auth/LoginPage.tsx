import AuthForm, { AuthField } from '../../components/auth/AuthForm';
import AuthShell from '../../components/auth/AuthShell';
import { useLoginPage } from '../../hooks/useLoginPage';

type LoginPageProps = {
  onNavigateRegister: () => void;
  onNavigateLanding: () => void;
  onLoginSuccess: () => void;
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

// Trang đăng nhập và xử lý modal quên mật khẩu.
function LoginPage({ onNavigateRegister, onNavigateLanding, onLoginSuccess }: LoginPageProps) {
  const {
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
  } = useLoginPage({ onLoginSuccess });

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
                      handleForgotEmailChange(event.target.value);
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
