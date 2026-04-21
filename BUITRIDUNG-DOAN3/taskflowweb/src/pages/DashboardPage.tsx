import React, { useEffect, useState } from 'react';
import '../assets/styles/Dashboard.css';
import {
  createProject,
  createWorkspace,
  CurrentUser,
  deleteProject,
  getCurrentUser,
  getProjectsByWorkspace,
  getUserWorkspaces,
  Project,
  updateProject,
  Workspace,
} from '../services/dashboard.service';

type DashboardPageProps = {
  onOpenProject: (project: Project) => void;
  onOpenAccountSettings: () => void;
  onLogout: () => void;
};

const roleLabelMap: Record<Workspace['role'], string> = {
  Owner: 'Chủ sở hữu',
  Admin: 'Quản trị viên',
  Member: 'Thành viên',
};

function DashboardPage({ onOpenProject, onOpenAccountSettings, onLogout }: DashboardPageProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [isCreateWorkspaceModalOpen, setIsCreateWorkspaceModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [deletingProjectName, setDeletingProjectName] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [createWorkspaceError, setCreateWorkspaceError] = useState('');
  const [createProjectError, setCreateProjectError] = useState('');
  const [editProjectError, setEditProjectError] = useState('');
  const [deleteProjectError, setDeleteProjectError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectSuccess, setProjectSuccess] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [userError, setUserError] = useState('');
  const [updatingProject, setUpdatingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const selectedWorkspace = workspaces.find((item) => item.workspaceId === selectedWorkspaceId) ?? null;
  const canManageSelectedWorkspace =
    selectedWorkspace?.role === 'Owner' || selectedWorkspace?.role === 'Admin';

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        setLoadingUser(true);
        setUserError('');

        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Không thể tải thông tin người dùng.';
        setUserError(message);
      } finally {
        setLoadingUser(false);
      }
    };

    void loadCurrentUser();
  }, []);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoadingWorkspaces(true);
        setWorkspaceError('');

        const items = await getUserWorkspaces();
        setWorkspaces(items);

        if (items.length > 0) {
          setSelectedWorkspaceId(items[0].workspaceId);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Không thể tải danh sách không gian làm việc.';
        setWorkspaceError(message);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    void loadWorkspaces();
  }, []);

  useEffect(() => {
    if (!selectedWorkspaceId) {
      setProjects([]);
      return;
    }

    const loadProjects = async () => {
      try {
        setLoadingProjects(true);
        setProjectError('');
        const items = await getProjectsByWorkspace(selectedWorkspaceId);
        setProjects(items);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải danh sách dự án.';
        setProjectError(message);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    void loadProjects();
  }, [selectedWorkspaceId]);

  const handleOpenCreateWorkspaceModal = () => {
    setCreateWorkspaceError('');
    setNewWorkspaceName('');
    setIsCreateWorkspaceModalOpen(true);
  };

  const handleCloseCreateWorkspaceModal = () => {
    if (creatingWorkspace) {
      return;
    }

    setIsCreateWorkspaceModalOpen(false);
    setCreateWorkspaceError('');
    setNewWorkspaceName('');
  };

  const handleCreateWorkspace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = newWorkspaceName.trim();

    if (!trimmedName) {
      setCreateWorkspaceError('Tên không gian làm việc không được để trống.');
      return;
    }

    if (trimmedName.length < 2) {
      setCreateWorkspaceError('Tên không gian làm việc cần ít nhất 2 ký tự.');
      return;
    }

    try {
      setCreatingWorkspace(true);
      setWorkspaceError('');
      setCreateWorkspaceError('');

      const newWorkspace = await createWorkspace(trimmedName);
      setWorkspaces((prev) => [newWorkspace, ...prev]);
      setSelectedWorkspaceId(newWorkspace.workspaceId);
      handleCloseCreateWorkspaceModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tạo không gian làm việc mới.';
      setCreateWorkspaceError(message);
    } finally {
      setCreatingWorkspace(false);
    }
  };

  const handleOpenCreateProjectModal = () => {
    if (!selectedWorkspaceId) {
      setWorkspaceError('Vui lòng chọn không gian làm việc trước khi tạo dự án.');
      return;
    }

    setCreateProjectError('');
    setProjectSuccess('');
    setNewProjectName('');
    setNewProjectDescription('');
    setIsCreateProjectModalOpen(true);
  };

  const handleCloseCreateProjectModal = () => {
    if (creatingProject) {
      return;
    }

    setIsCreateProjectModalOpen(false);
    setCreateProjectError('');
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleCreateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedWorkspaceId) {
      setCreateProjectError('Không có không gian làm việc được chọn.');
      return;
    }

    const trimmedName = newProjectName.trim();
    const trimmedDescription = newProjectDescription.trim();

    if (!trimmedName) {
      setCreateProjectError('Tên dự án không được để trống.');
      return;
    }

    if (trimmedName.length < 2) {
      setCreateProjectError('Tên dự án cần ít nhất 2 ký tự.');
      return;
    }

    try {
      setCreatingProject(true);
      setCreateProjectError('');

      const created = await createProject({
        workspaceId: selectedWorkspaceId,
        name: trimmedName,
        description: trimmedDescription || undefined,
      });

      setProjects((prev) => [
        {
          ...created,
          workspaceId: selectedWorkspaceId,
          description: created.description ?? undefined,
        },
        ...prev,
      ]);
      setProjectSuccess('Tạo dự án thành công.');

      handleCloseCreateProjectModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo dự án mới.';
      setCreateProjectError(message);
    } finally {
      setCreatingProject(false);
    }
  };

  const handleOpenEditProjectModal = (project: Project) => {
    setEditProjectError('');
    setProjectSuccess('');
    setEditingProjectId(project.projectId);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description ?? '');
    setIsEditProjectModalOpen(true);
  };

  const handleCloseEditProjectModal = () => {
    if (updatingProject) {
      return;
    }

    setIsEditProjectModalOpen(false);
    setEditProjectError('');
    setEditingProjectId(null);
    setEditProjectName('');
    setEditProjectDescription('');
  };

  const handleUpdateProject = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingProjectId) {
      setEditProjectError('Không tìm thấy dự án cần cập nhật.');
      return;
    }

    const trimmedName = editProjectName.trim();
    const trimmedDescription = editProjectDescription.trim();

    if (!trimmedName) {
      setEditProjectError('Tên dự án không được để trống.');
      return;
    }

    if (trimmedName.length < 2) {
      setEditProjectError('Tên dự án cần ít nhất 2 ký tự.');
      return;
    }

    try {
      setUpdatingProject(true);
      setEditProjectError('');

      const updated = await updateProject(editingProjectId, {
        name: trimmedName,
        description: trimmedDescription || undefined,
      });

      setProjects((prev) =>
        prev.map((item) =>
          item.projectId === editingProjectId
            ? {
                ...item,
                name: updated.name,
                description: updated.description ?? undefined,
                updatedAt: updated.updatedAt,
              }
            : item
        )
      );
      setProjectSuccess('Cập nhật dự án thành công.');

      handleCloseEditProjectModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật dự án.';
      setEditProjectError(message);
    } finally {
      setUpdatingProject(false);
    }
  };

  const handleOpenDeleteProjectModal = (project: Project) => {
    setDeleteProjectError('');
    setProjectSuccess('');
    setDeletingProjectId(project.projectId);
    setDeletingProjectName(project.name);
    setIsDeleteProjectModalOpen(true);
  };

  const handleCloseDeleteProjectModal = () => {
    if (deletingProject) {
      return;
    }

    setIsDeleteProjectModalOpen(false);
    setDeleteProjectError('');
    setDeletingProjectId(null);
    setDeletingProjectName('');
  };

  const handleDeleteProject = async () => {
    if (!deletingProjectId) {
      setDeleteProjectError('Không tìm thấy dự án cần xóa.');
      return;
    }

    try {
      setDeletingProject(true);
      setDeleteProjectError('');

      const deletedMessage = await deleteProject(deletingProjectId);

      setProjects((prev) => prev.filter((item) => item.projectId !== deletingProjectId));
      setProjectSuccess(deletedMessage || 'Đã xóa dự án thành công.');
      handleCloseDeleteProjectModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa dự án.';
      setDeleteProjectError(message);
    } finally {
      setDeletingProject(false);
    }
  };

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
            {workspaces.map((workspace) => (
              <button
                key={workspace.workspaceId}
                type="button"
                className={`dashboard-workspace-item${
                  workspace.workspaceId === selectedWorkspaceId ? ' is-active' : ''
                }`}
                onClick={() => setSelectedWorkspaceId(workspace.workspaceId)}
              >
                <strong>{workspace.name}</strong>
                <span>Vai trò: {roleLabelMap[workspace.role]}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-logo">Bảng điều khiển TASKFLOW</div>

            <div className="dashboard-user-area">
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
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onOpenAccountSettings();
                      }}
                    >
                      Quản lý tài khoản
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        onLogout();
                      }}
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
    </div>
  );
}

export default DashboardPage;
