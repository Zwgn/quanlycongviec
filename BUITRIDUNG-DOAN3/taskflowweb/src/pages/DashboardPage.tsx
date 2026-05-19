import '../assets/styles/Dashboard.css';
import ConfirmModal from '../components/common/ConfirmModal';
import { useDashboardPage } from '../hooks/useDashboardPage';
import type { Project } from '../services/dashboard.service';

type DashboardPageProps = {
  onOpenProject: (project: Project) => void;
  onOpenAccountSettings: () => void;
  onLogout: () => void;
};

// Trang dashboard quản lý workspace, dự án và thông báo.
function DashboardPage({ onOpenProject, onOpenAccountSettings, onLogout }: DashboardPageProps) {
  const {
    roleLabelMap,
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    projects,
    currentUser,
    loadingWorkspaces,
    loadingProjects,
    loadingUser,
    creatingWorkspace,
    creatingProject,
    isCreateWorkspaceModalOpen,
    isCreateProjectModalOpen,
    isEditWorkspaceModalOpen,
    isDeleteWorkspaceModalOpen,
    isEditProjectModalOpen,
    isDeleteProjectModalOpen,
    newWorkspaceName,
    setNewWorkspaceName,
    editWorkspaceName,
    setEditWorkspaceName,
    newProjectName,
    setNewProjectName,
    newProjectDescription,
    setNewProjectDescription,
    deletingWorkspaceName,
    deletingProjectName,
    editProjectName,
    setEditProjectName,
    editProjectDescription,
    setEditProjectDescription,
    createWorkspaceError,
    editWorkspaceError,
    deleteWorkspaceError,
    createProjectError,
    editProjectError,
    deleteProjectError,
    projectError,
    projectSuccess,
    workspaceError,
    userError,
    updatingWorkspace,
    deletingWorkspace,
    updatingProject,
    deletingProject,
    isAccountMenuOpen,
    setIsAccountMenuOpen,
    isShareModalOpen,
    setIsShareModalOpen,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteError,
    memberActionError,
    workspaceMembers,
    notifications,
    isNotificationPanelOpen,
    setIsNotificationPanelOpen,
    confirmState,
    isConfirmSubmitting,
    selectedWorkspace,
    canManageSelectedWorkspace,
    canInviteAdmin,
    unreadNotifications,
    canManageMemberRole,
    canRemoveMember,
    handleConfirm,
    handleCloseConfirm,
    handleOpenShareModal,
    handleInviteWorkspaceMember,
    handleUpdateMemberRole,
    handleRemoveMemberFromWorkspace,
    handleOpenCreateWorkspaceModal,
    handleCloseCreateWorkspaceModal,
    handleCreateWorkspace,
    handleOpenEditWorkspaceModal,
    handleCloseEditWorkspaceModal,
    handleUpdateWorkspace,
    handleOpenDeleteWorkspaceModal,
    handleCloseDeleteWorkspaceModal,
    handleDeleteWorkspace,
    handleOpenCreateProjectModal,
    handleCloseCreateProjectModal,
    handleCreateProject,
    handleOpenEditProjectModal,
    handleCloseEditProjectModal,
    handleUpdateProject,
    handleOpenDeleteProjectModal,
    handleCloseDeleteProjectModal,
    handleDeleteProject,
    handleOpenAccountSettings,
    handleLogout,
  } = useDashboardPage({ onOpenAccountSettings, onLogout });

  return (
    <div className="dashboard-root">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div>
            <h2>Không gian làm việc</h2>
            <p>Chọn không gian làm việc để tiếp tục.</p>
          </div>

          <button
            type="button"
            className="dashboard-create-button"
            onClick={handleOpenCreateWorkspaceModal}
            disabled={creatingWorkspace}
          >
            {creatingWorkspace ? 'Đang tạo...' : '+ Tạo không gian làm việc'}
          </button>

          {loadingWorkspaces ? <p className="dashboard-hint">Đang tải không gian làm việc...</p> : null}
          {workspaceError ? <p className="dashboard-error">{workspaceError}</p> : null}

          <div className="dashboard-workspace-list">
            {workspaces.map((workspace) => {
              const canManageWorkspace = workspace.role === 'Owner' || workspace.role === 'Admin';

              return (
                <article
                  key={workspace.workspaceId}
                  className={`dashboard-workspace-item${
                    workspace.workspaceId === selectedWorkspaceId ? ' is-active' : ''
                  }`}
                  onClick={() => setSelectedWorkspaceId(workspace.workspaceId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedWorkspaceId(workspace.workspaceId);
                    }
                  }}
                >
                  <strong>{workspace.name}</strong>
                  <span>Vai trò: {roleLabelMap[workspace.role]}</span>

                  {canManageWorkspace ? (
                    <div className="dashboard-workspace-icon-actions">
                      <button
                        type="button"
                        className="dashboard-edit-project dashboard-workspace-edit"
                        aria-label="Sửa không gian làm việc"
                        title="Sửa không gian làm việc"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenEditWorkspaceModal(workspace);
                        }}
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
                      <button
                        type="button"
                        className="dashboard-delete-project dashboard-workspace-delete"
                        aria-label="Xóa không gian làm việc"
                        title="Xóa không gian làm việc"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleOpenDeleteWorkspaceModal(workspace);
                        }}
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path
                            d="M7 9h10M9 9V7.8c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2V9M8.4 9l.6 8.1c.05.62.57 1.1 1.2 1.1h3.6c.63 0 1.15-.48 1.2-1.1l.6-8.1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </aside>

        <section className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-logo">Bảng điều khiển TASKFLOW</div>

            <div className="dashboard-user-area">
              <button
                type="button"
                className="dashboard-share-btn"
                onClick={() => {
                  void handleOpenShareModal();
                }}
                disabled={!selectedWorkspace || !canManageSelectedWorkspace}
                title={
                  !selectedWorkspace
                    ? 'Vui lòng chọn không gian làm việc'
                    : !canManageSelectedWorkspace
                      ? 'Bạn không có quyền chia sẻ không gian làm việc này'
                      : undefined
                }
              >
                + Chia sẻ
              </button>

              <div className="dashboard-notification-wrap">
                <button
                  type="button"
                  className="dashboard-bell-btn"
                  aria-label="Danh sách thông báo"
                  onClick={() => setIsNotificationPanelOpen((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="dashboard-bell-icon">
                    <path
                      d="M12 4a5 5 0 0 0-5 5v2.8c0 .7-.2 1.4-.6 2L5.2 16h13.6l-1.2-2.2a4 4 0 0 1-.6-2V9a5 5 0 0 0-5-5Z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 18a2 2 0 0 0 4 0"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {unreadNotifications > 0 ? (
                    <span className="dashboard-bell-badge">{unreadNotifications}</span>
                  ) : null}
                </button>

                {isNotificationPanelOpen ? (
                  <div className="dashboard-notification-panel" role="region" aria-label="Danh sách thông báo">
                    <h4>Danh sách thông báo</h4>
                    {notifications.length === 0 ? (
                      <p className="dashboard-notification-empty">Chưa có thông báo mới.</p>
                    ) : (
                      <div className="dashboard-notification-list">
                        {notifications.map((item) => (
                          <article key={item.id} className="dashboard-notification-item">
                            <strong>{item.message}</strong>
                            <span>{item.timeLabel}</span>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="dashboard-account-wrap">
                <button
                  type="button"
                  className="dashboard-user-chip"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                >
                  <strong>
                    {loadingUser
                      ? 'Đang tải thông tin...'
                      : currentUser?.fullName || 'Thành viên TaskFlow'}
                  </strong>
                  <span>{currentUser?.email || userError || 'user@taskflow.app'}</span>
                </button>

                {isAccountMenuOpen ? (
                  <div className="dashboard-account-menu" role="menu" aria-label="Menu tài khoản không gian làm việc">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleOpenAccountSettings}
                    >
                      Quản lý tài khoản
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <div className="dashboard-content">
            <div className="dashboard-content-head">
              <div>
                <h1>{selectedWorkspace ? selectedWorkspace.name : 'Chưa có không gian làm việc'}</h1>
                <p>
                  {selectedWorkspace
                    ? 'Danh sách dự án trong không gian làm việc đang chọn.'
                    : 'Hãy tạo không gian làm việc mới để bắt đầu.'}
                </p>
              </div>

              <button
                type="button"
                className="dashboard-create-project"
                onClick={handleOpenCreateProjectModal}
                disabled={!selectedWorkspace || !canManageSelectedWorkspace}
                title={
                  !selectedWorkspace
                    ? 'Vui lòng chọn không gian làm việc'
                    : !canManageSelectedWorkspace
                      ? 'Bạn không có quyền tạo dự án trong không gian làm việc này'
                      : undefined
                }
              >
                + Tạo dự án
              </button>
            </div>

            {loadingProjects ? <p className="dashboard-hint">Đang tải dự án...</p> : null}
            {projectError ? <p className="dashboard-error">{projectError}</p> : null}
            {projectSuccess ? <p className="dashboard-success">{projectSuccess}</p> : null}

            {!loadingProjects && projects.length === 0 ? (
              <p className="dashboard-hint">Không gian làm việc này chưa có dự án. Tạo dự án đầu tiên ngay.</p>
            ) : null}

            <div className="dashboard-project-grid">
              {projects.map((project) => (
                <article
                  key={project.projectId}
                  className="dashboard-project-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => onOpenProject(project)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onOpenProject(project);
                    }
                  }}
                >
                  <div className="dashboard-project-card-top">
                    <h3>{project.name}</h3>
                    {canManageSelectedWorkspace ? (
                      <div className="dashboard-project-icon-actions">
                        <button
                          type="button"
                          className="dashboard-edit-project"
                          aria-label="Sửa dự án"
                          title="Sửa dự án"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEditProjectModal(project);
                          }}
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
                        <button
                          type="button"
                          className="dashboard-delete-project"
                          aria-label="Xóa dự án"
                          title="Xóa dự án"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenDeleteProjectModal(project);
                          }}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M7 9h10M9 9V7.8c0-.66.54-1.2 1.2-1.2h3.6c.66 0 1.2.54 1.2 1.2V9M8.4 9l.6 8.1c.05.62.57 1.1 1.2 1.1h3.6c.63 0 1.15-.48 1.2-1.1l.6-8.1"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p>{project.description || 'Không có mô tả ngắn cho dự án này.'}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>

      {isCreateWorkspaceModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseCreateWorkspaceModal();
            }
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Tạo không gian làm việc mới">
            <h3>Tạo không gian làm việc mới</h3>
            <p>Nhập tên không gian làm việc để bắt đầu quản lý dự án và bảng.</p>

            <form className="dashboard-modal-form" onSubmit={handleCreateWorkspace} noValidate>
              <label htmlFor="workspaceName" className="dashboard-modal-label">
                Tên không gian làm việc
              </label>
              <input
                id="workspaceName"
                className={`dashboard-modal-input${createWorkspaceError ? ' is-error' : ''}`}
                value={newWorkspaceName}
                onChange={(event) => {
                  setNewWorkspaceName(event.target.value);
                  if (createWorkspaceError) {
                    setCreateWorkspaceError('');
                  }
                }}
                placeholder="Ví dụ: Product Team"
                maxLength={255}
                disabled={creatingWorkspace}
                autoFocus
              />

              {createWorkspaceError ? (
                <p className="dashboard-modal-error">{createWorkspaceError}</p>
              ) : null}

              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-cancel"
                  onClick={handleCloseCreateWorkspaceModal}
                  disabled={creatingWorkspace}
                >
                  Hủy
                </button>
                <button type="submit" className="dashboard-modal-submit" disabled={creatingWorkspace}>
                  {creatingWorkspace ? 'Đang tạo...' : 'Tạo không gian làm việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditWorkspaceModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditWorkspaceModal();
            }
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Sửa không gian làm việc">
            <h3>Sửa không gian làm việc</h3>
            <p>Cập nhật tên không gian làm việc hiện tại.</p>

            <form className="dashboard-modal-form" onSubmit={handleUpdateWorkspace} noValidate>
              <label htmlFor="editWorkspaceName" className="dashboard-modal-label">
                Tên không gian làm việc
              </label>
              <input
                id="editWorkspaceName"
                className={`dashboard-modal-input${editWorkspaceError ? ' is-error' : ''}`}
                value={editWorkspaceName}
                onChange={(event) => {
                  setEditWorkspaceName(event.target.value);
                  if (editWorkspaceError) {
                    setEditWorkspaceError('');
                  }
                }}
                placeholder="Ví dụ: Product Team"
                maxLength={255}
                disabled={updatingWorkspace}
                autoFocus
              />

              {editWorkspaceError ? <p className="dashboard-modal-error">{editWorkspaceError}</p> : null}

              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-cancel"
                  onClick={handleCloseEditWorkspaceModal}
                  disabled={updatingWorkspace}
                >
                  Hủy
                </button>
                <button type="submit" className="dashboard-modal-submit" disabled={updatingWorkspace}>
                  {updatingWorkspace ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteWorkspaceModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDeleteWorkspaceModal();
            }
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Xóa không gian làm việc">
            <h3>Xóa không gian làm việc</h3>
            <p>
              Bạn có chắc muốn xóa không gian làm việc <strong>{deletingWorkspaceName}</strong> không?
            </p>
            <p>Hành động này không thể hoàn tác.</p>

            {deleteWorkspaceError ? <p className="dashboard-modal-error">{deleteWorkspaceError}</p> : null}

            <div className="dashboard-modal-actions">
              <button
                type="button"
                className="dashboard-modal-cancel"
                onClick={handleCloseDeleteWorkspaceModal}
                disabled={deletingWorkspace}
              >
                Hủy
              </button>
              <button
                type="button"
                className="dashboard-modal-delete"
                onClick={handleDeleteWorkspace}
                disabled={deletingWorkspace}
              >
                {deletingWorkspace ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isCreateProjectModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseCreateProjectModal();
            }
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Tạo dự án mới">
            <h3>Tạo dự án mới</h3>
            <p>Nhập thông tin dự án để thêm vào không gian làm việc đang chọn.</p>

            <form className="dashboard-modal-form" onSubmit={handleCreateProject} noValidate>
              <label htmlFor="projectName" className="dashboard-modal-label">
                Tên dự án
              </label>
              <input
                id="projectName"
                className={`dashboard-modal-input${createProjectError ? ' is-error' : ''}`}
                value={newProjectName}
                onChange={(event) => {
                  setNewProjectName(event.target.value);
                  if (createProjectError) {
                    setCreateProjectError('');
                  }
                }}
                placeholder="Ví dụ: Sprint 1"
                maxLength={255}
                disabled={creatingProject}
                autoFocus
              />

              <label htmlFor="projectDescription" className="dashboard-modal-label">
                Mô tả dự án (tùy chọn)
              </label>
              <textarea
                id="projectDescription"
                className="dashboard-modal-textarea"
                value={newProjectDescription}
                onChange={(event) => setNewProjectDescription(event.target.value)}
                placeholder="Nhập mô tả ngắn cho dự án"
                rows={4}
                maxLength={1000}
                disabled={creatingProject}
              />

              {createProjectError ? <p className="dashboard-modal-error">{createProjectError}</p> : null}

              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-cancel"
                  onClick={handleCloseCreateProjectModal}
                  disabled={creatingProject}
                >
                  Hủy
                </button>
                <button type="submit" className="dashboard-modal-submit" disabled={creatingProject}>
                  {creatingProject ? 'Đang tạo...' : 'Tạo dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isEditProjectModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseEditProjectModal();
            }
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Sửa dự án">
            <h3>Sửa dự án</h3>
            <p>Cập nhật tên và mô tả dự án hiện tại.</p>

            <form className="dashboard-modal-form" onSubmit={handleUpdateProject} noValidate>
              <label htmlFor="editProjectName" className="dashboard-modal-label">
                Tên dự án
              </label>
              <input
                id="editProjectName"
                className={`dashboard-modal-input${editProjectError ? ' is-error' : ''}`}
                value={editProjectName}
                onChange={(event) => {
                  setEditProjectName(event.target.value);
                  if (editProjectError) {
                    setEditProjectError('');
                  }
                }}
                placeholder="Ví dụ: Sprint 1"
                maxLength={255}
                disabled={updatingProject}
                autoFocus
              />

              <label htmlFor="editProjectDescription" className="dashboard-modal-label">
                Mô tả dự án (tùy chọn)
              </label>
              <textarea
                id="editProjectDescription"
                className="dashboard-modal-textarea"
                value={editProjectDescription}
                onChange={(event) => setEditProjectDescription(event.target.value)}
                placeholder="Nhập mô tả ngắn cho dự án"
                rows={4}
                maxLength={1000}
                disabled={updatingProject}
              />

              {editProjectError ? <p className="dashboard-modal-error">{editProjectError}</p> : null}

              <div className="dashboard-modal-actions">
                <button
                  type="button"
                  className="dashboard-modal-cancel"
                  onClick={handleCloseEditProjectModal}
                  disabled={updatingProject}
                >
                  Hủy
                </button>
                <button type="submit" className="dashboard-modal-submit" disabled={updatingProject}>
                  {updatingProject ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isDeleteProjectModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseDeleteProjectModal();
            }
          }}
        >
          <div className="dashboard-modal" role="dialog" aria-modal="true" aria-label="Xóa dự án">
            <h3>Xóa dự án</h3>
            <p>
              Bạn có chắc muốn xóa dự án <strong>{deletingProjectName}</strong> không?
            </p>
            <p>Hành động này không thể hoàn tác.</p>

            {deleteProjectError ? <p className="dashboard-modal-error">{deleteProjectError}</p> : null}

            <div className="dashboard-modal-actions">
              <button
                type="button"
                className="dashboard-modal-cancel"
                onClick={handleCloseDeleteProjectModal}
                disabled={deletingProject}
              >
                Hủy
              </button>
              <button
                type="button"
                className="dashboard-modal-delete"
                onClick={handleDeleteProject}
                disabled={deletingProject}
              >
                {deletingProject ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isShareModalOpen ? (
        <div
          className="dashboard-modal-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsShareModalOpen(false);
            }
          }}
        >
          <div className="dashboard-share-modal" role="dialog" aria-modal="true" aria-label="Mời thành viên workspace">
            <div className="dashboard-share-head">
              <h3>Chia sẻ workspace</h3>
              <button type="button" className="dashboard-share-close" onClick={() => setIsShareModalOpen(false)}>
                x
              </button>
            </div>

            <form className="dashboard-share-form" onSubmit={handleInviteWorkspaceMember}>
              <div className="dashboard-share-invite-row">
                <input
                  className="dashboard-modal-input"
                  value={inviteEmail}
                  onChange={(event) => {
                    setInviteEmail(event.target.value);
                    if (inviteError) {
                      setInviteError('');
                    }
                  }}
                  placeholder="Địa chỉ email"
                  autoFocus
                />
                <select
                  className="dashboard-share-role"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as 'Thành viên' | 'Quản trị viên')}
                >
                  <option value="Thành viên">Thành viên</option>
                  {canInviteAdmin ? <option value="Quản trị viên">Quản trị viên</option> : null}
                </select>
                <button type="submit" className="dashboard-modal-submit">
                  Chia sẻ
                </button>
              </div>
            </form>

            {inviteError ? <p className="dashboard-modal-error">{inviteError}</p> : null}
            {memberActionError ? <p className="dashboard-modal-error">{memberActionError}</p> : null}

            <div className="dashboard-share-tabs">
              <button type="button" className="dashboard-share-tab is-active">
                Thành viên workspace <span>{workspaceMembers.length}</span>
              </button>
            </div>

            <div className="dashboard-share-members">
              {workspaceMembers.map((member) => (
                <div key={member.userId} className="dashboard-share-member-item">
                  <div className="dashboard-share-member-meta">
                    <strong>{member.fullName}{member.userId === currentUser?.userId ? ' (bạn)' : ''}</strong>
                    <p>{member.email} • {roleLabelMap[member.role]}</p>
                  </div>
                  <div className="dashboard-share-member-actions">
                    {canManageMemberRole(member) ? (
                      <select
                        className="dashboard-share-member-role"
                        value={member.role}
                        onChange={(event) => {
                          const nextRole = event.target.value as 'Admin' | 'Member';
                          void handleUpdateMemberRole(member, nextRole);
                        }}
                      >
                        <option value="Member">Thành viên</option>
                        {selectedWorkspace?.role === 'Owner' ? <option value="Admin">Quản trị viên</option> : null}
                      </select>
                    ) : (
                      <button type="button" className="dashboard-share-member-role" disabled>
                        {roleLabelMap[member.role]}
                      </button>
                    )}

                    {canRemoveMember(member) ? (
                      <button
                        type="button"
                        className="dashboard-share-member-remove"
                        onClick={() => {
                          void handleRemoveMemberFromWorkspace(member);
                        }}
                      >
                        Xóa
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        isDanger={confirmState.isDanger}
        isSubmitting={isConfirmSubmitting}
        onCancel={handleCloseConfirm}
        onConfirm={handleConfirm}
      />
    </div>
  );
}

export default DashboardPage;
