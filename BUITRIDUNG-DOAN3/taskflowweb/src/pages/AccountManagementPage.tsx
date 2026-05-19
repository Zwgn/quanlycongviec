import '../assets/styles/AccountManagement.css';
import { useAccountManagementPage } from '../hooks/useAccountManagementPage';
import type { Project } from '../services/dashboard.service';

type AccountManagementPageProps = {
  onBackToDashboard: () => void;
  onOpenProject: (project: Project) => void;
  onLogout: () => void;
};

// Trang quản lý tài khoản và đổi mật khẩu.
function AccountManagementPage({ onBackToDashboard, onOpenProject, onLogout }: AccountManagementPageProps) {
  const {
    currentUser,
    nameDraft,
    setNameDraft,
    currentPasswordDraft,
    setCurrentPasswordDraft,
    newPasswordDraft,
    setNewPasswordDraft,
    confirmPasswordDraft,
    setConfirmPasswordDraft,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    ownedWorkspaces,
    sharedWorkspaces,
    projects,
    isLoading,
    pageError,
    profileError,
    setProfileError,
    profileSuccess,
    passwordError,
    passwordSuccess,
    isPasswordModalOpen,
    setIsPasswordModalOpen,
    isPasswordSubmitting,
    handleSubmitProfile,
    handleSubmitPassword,
    handleOpenPasswordModal,
  } = useAccountManagementPage();

  return (
    <div className="account-page-root">
      <header className="account-page-topbar">
        <button type="button" className="account-page-back" onClick={onBackToDashboard}>
          ← Về Dashboard
        </button>

        <div className="account-page-topbar-actions">
          <button type="button" className="account-page-logout" onClick={onLogout}>
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="account-page-main" aria-label="Quản lý tài khoản TaskFlow">
        <section className="account-page-section">
          <h1>Quản lý tài khoản</h1>
          {isLoading ? <p className="account-page-hint">Đang tải dữ liệu...</p> : null}
          {pageError ? <p className="account-page-error">{pageError}</p> : null}
        </section>

        <section className="account-page-section">
          <h2>Thông tin cá nhân</h2>
          <form className="account-page-form" onSubmit={handleSubmitProfile}>
            <label htmlFor="accountFullName">Tên người dùng</label>
            <input
              id="accountFullName"
              value={nameDraft}
              onChange={(event) => {
                setNameDraft(event.target.value);
                if (profileError) {
                  setProfileError('');
                }
              }}
              placeholder="Nhập tên hiển thị"
            />

            <label htmlFor="accountEmail">Email</label>
            <input
              id="accountEmail"
              value={currentUser?.email ?? ''}
              readOnly
              disabled
            />

            <div className="account-page-form-actions">
              <button type="submit">Cập nhật thông tin</button>
            </div>
          </form>
          {profileError ? <p className="account-page-error">{profileError}</p> : null}
          {profileSuccess ? <p className="account-page-success">{profileSuccess}</p> : null}
        </section>

        <section className="account-page-section">
          <h2>Đổi mật khẩu</h2>
          <div className="account-password-row">
            <div>
              <strong>Mật khẩu</strong>
              <p>********</p>
            </div>
            <button
              type="button"
              className="account-password-edit"
              aria-label="Sửa mật khẩu"
              title="Sửa mật khẩu"
              onClick={handleOpenPasswordModal}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 16.5V20h3.5L18.4 9.1l-3.5-3.5L4 16.5Zm11.7-9.8 2.1-2.1a1.5 1.5 0 0 1 2.1 0l.9.9a1.5 1.5 0 0 1 0 2.1l-2.1 2.1-3-2.9Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {passwordError ? <p className="account-page-error">{passwordError}</p> : null}
          {passwordSuccess ? <p className="account-page-success">{passwordSuccess}</p> : null}
        </section>

        <section className="account-page-section">
          <h2>Workspace sở hữu</h2>
          {ownedWorkspaces.length === 0 ? (
            <p className="account-page-hint">Bạn chưa sở hữu workspace nào.</p>
          ) : (
            <div className="account-page-chip-list">
              {ownedWorkspaces.map((workspace) => (
                <button
                  key={workspace.workspaceId}
                  type="button"
                  className="account-page-chip"
                  onClick={onBackToDashboard}
                >
                  {workspace.name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="account-page-section">
          <h2>Workspace tham gia</h2>
          {sharedWorkspaces.length === 0 ? (
            <p className="account-page-hint">Bạn chưa tham gia workspace nào được chia sẻ.</p>
          ) : (
            <div className="account-page-list">
              {sharedWorkspaces.map((workspace) => (
                <article key={workspace.workspaceId} className="account-page-list-item">
                  <strong>{workspace.name}</strong>
                  <span>{workspace.role === 'Admin' ? 'Quản trị viên' : 'Thành viên'}</span>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="account-page-section">
          <h2>Dự án tham gia</h2>
          {projects.length === 0 ? (
            <p className="account-page-hint">Bạn chưa có dự án khả dụng.</p>
          ) : (
            <div className="account-page-list">
              {projects.map((project) => (
                <button
                  key={project.projectId}
                  type="button"
                  className="account-page-project-item"
                  onClick={() => onOpenProject(project)}
                >
                  <strong>{project.name}</strong>
                  <span>{project.workspaceName}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {isPasswordModalOpen ? (
        <div
          className="account-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsPasswordModalOpen(false);
            }
          }}
        >
          <div className="account-modal" role="dialog" aria-modal="true" aria-label="Đổi mật khẩu">
            <div className="account-modal-head">
              <h3>Đổi mật khẩu</h3>
              <button
                type="button"
                className="account-modal-close"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                ×
              </button>
            </div>

            <form className="account-page-form" onSubmit={handleSubmitPassword}>
              <label htmlFor="accountCurrentPassword">Mật khẩu cũ</label>
              <div className="account-password-input-wrap">
                <input
                  id="accountCurrentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPasswordDraft}
                  onChange={(event) => setCurrentPasswordDraft(event.target.value)}
                  placeholder="Nhập mật khẩu cũ"
                />
                <button
                  type="button"
                  className="account-password-visibility"
                  aria-label={showCurrentPassword ? 'Ẩn mật khẩu cũ' : 'Hiện mật khẩu cũ'}
                  title={showCurrentPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    {!showCurrentPassword ? (
                      <path
                        d="M4 4l16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </svg>
                </button>
              </div>

              <label htmlFor="accountNewPassword">Mật khẩu mới</label>
              <div className="account-password-input-wrap">
                <input
                  id="accountNewPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPasswordDraft}
                  onChange={(event) => setNewPasswordDraft(event.target.value)}
                  placeholder="Nhập mật khẩu mới"
                />
                <button
                  type="button"
                  className="account-password-visibility"
                  aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                  title={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    {!showNewPassword ? (
                      <path
                        d="M4 4l16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </svg>
                </button>
              </div>

              <label htmlFor="accountConfirmPassword">Xác nhận mật khẩu</label>
              <div className="account-password-input-wrap">
                <input
                  id="accountConfirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPasswordDraft}
                  onChange={(event) => setConfirmPasswordDraft(event.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                />
                <button
                  type="button"
                  className="account-password-visibility"
                  aria-label={showConfirmPassword ? 'Ẩn xác nhận mật khẩu' : 'Hiện xác nhận mật khẩu'}
                  title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    {!showConfirmPassword ? (
                      <path
                        d="M4 4l16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </svg>
                </button>
              </div>

              <div className="account-page-form-actions">
                <button type="submit" disabled={isPasswordSubmitting}>
                  {isPasswordSubmitting ? 'Đang lưu...' : 'Lưu mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AccountManagementPage;