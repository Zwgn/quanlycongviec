import React, { useEffect, useMemo, useState } from 'react';
import '../assets/styles/AccountManagement.css';
import {
  CurrentUser,
  getCurrentUser,
  getProjectsByWorkspace,
  getUserWorkspaces,
  Project,
  Workspace,
} from '../services/dashboard.service';

type AccountManagementPageProps = {
  onBackToDashboard: () => void;
  onOpenProject: (project: Project) => void;
  onLogout: () => void;
};

type ProjectWithWorkspace = Project & {
  workspaceId: number;
  workspaceName: string;
  workspaceRole: Workspace['role'];
};

function AccountManagementPage({ onBackToDashboard, onOpenProject, onLogout }: AccountManagementPageProps) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [currentPasswordDraft, setCurrentPasswordDraft] = useState('');
  const [newPasswordDraft, setNewPasswordDraft] = useState('');
  const [confirmPasswordDraft, setConfirmPasswordDraft] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<ProjectWithWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const ownedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.role === 'Owner'),
    [workspaces]
  );

  const sharedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.role === 'Admin' || workspace.role === 'Member'),
    [workspaces]
  );

  useEffect(() => {
    let isMounted = true;

    const loadAccountData = async () => {
      try {
        setIsLoading(true);
        setPageError('');

        const [user, userWorkspaces] = await Promise.all([getCurrentUser(), getUserWorkspaces()]);

        if (!isMounted) {
          return;
        }

        setCurrentUser(user);
        setNameDraft(user.fullName);
        setWorkspaces(userWorkspaces);

        const projectGroups = await Promise.all(
          userWorkspaces.map(async (workspace) => {
            try {
              const workspaceProjects = await getProjectsByWorkspace(workspace.workspaceId);

              return workspaceProjects.map((project) => ({
                ...project,
                workspaceId: workspace.workspaceId,
                workspaceName: workspace.name,
                workspaceRole: workspace.role,
              }));
            } catch (_error) {
              return [] as ProjectWithWorkspace[];
            }
          })
        );

        if (!isMounted) {
          return;
        }

        const uniqueProjects = new Map<number, ProjectWithWorkspace>();
        projectGroups.flat().forEach((project) => {
          uniqueProjects.set(project.projectId, project);
        });

        setProjects(Array.from(uniqueProjects.values()));
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Không thể tải dữ liệu quản lý tài khoản.';
        setPageError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAccountData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmitProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = nameDraft.trim();

    if (!trimmedName) {
      setProfileError('Tên người dùng không được để trống.');
      setProfileSuccess('');
      return;
    }

    if (trimmedName.length < 2) {
      setProfileError('Tên người dùng cần ít nhất 2 ký tự.');
      setProfileSuccess('');
      return;
    }

    setCurrentUser((prev) => {
      if (!prev) {
        return prev;
      }

      const next = {
        ...prev,
        fullName: trimmedName,
      };

      localStorage.setItem('taskflow_user', JSON.stringify(next));
      return next;
    });

    setProfileError('');
    setProfileSuccess('Đã cập nhật tên người dùng.');
  };

  const handleSubmitPassword = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentPasswordDraft || !newPasswordDraft || !confirmPasswordDraft) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin đổi mật khẩu.');
      setPasswordSuccess('');
      return;
    }

    if (newPasswordDraft.length < 6) {
      setPasswordError('Mật khẩu mới cần ít nhất 6 ký tự.');
      setPasswordSuccess('');
      return;
    }

    if (newPasswordDraft !== confirmPasswordDraft) {
      setPasswordError('Xác nhận mật khẩu không khớp.');
      setPasswordSuccess('');
      return;
    }

    setPasswordError('');
    setPasswordSuccess('Đã cập nhật mật khẩu thành công.');
    setCurrentPasswordDraft('');
    setNewPasswordDraft('');
    setConfirmPasswordDraft('');
    setIsPasswordModalOpen(false);
  };

  const handleOpenPasswordModal = () => {
    setCurrentPasswordDraft('');
    setNewPasswordDraft('');
    setConfirmPasswordDraft('');
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  };

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
                <button type="submit">Lưu mật khẩu</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AccountManagementPage;