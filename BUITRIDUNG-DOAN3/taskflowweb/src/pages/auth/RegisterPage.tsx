import AuthForm, { AuthField } from '../../components/auth/AuthForm';
import AuthShell from '../../components/auth/AuthShell';
import { useRegisterPage } from '../../hooks/useRegisterPage';

type RegisterPageProps = {
  onNavigateLogin: () => void;
  onNavigateLanding: () => void;
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

// Trang đăng ký tài khoản mới.
function RegisterPage({ onNavigateLogin, onNavigateLanding }: RegisterPageProps) {
  const {
    highlights,
    values,
    errors,
    submitError,
    submitSuccess,
    isSubmitting,
    onInputChange,
    onSubmit,
  } = useRegisterPage({ onNavigateLogin });

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
