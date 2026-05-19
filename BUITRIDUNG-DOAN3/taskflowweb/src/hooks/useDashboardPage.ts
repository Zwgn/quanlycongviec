import React, { useEffect, useRef, useState } from 'react';
import {
  addWorkspaceMember,
  createProject,
  createWorkspace,
  CurrentUser,
  deleteProject,
  deleteWorkspace,
  getCurrentUser,
  getProjectsByWorkspace,
  getWorkspaceMembers,
  getUserWorkspaces,
  Project,
  removeWorkspaceMember,
  updateProject,
  updateWorkspace,
  updateWorkspaceMemberRole,
  Workspace,
  WorkspaceMember,
} from '../services/dashboard.service';
import { loadNotifications, saveNotifications } from '../utils/notificationStorage';

type UseDashboardPageParams = {
  onOpenAccountSettings: () => void;
  onLogout: () => void;
};

type NotificationItem = {
  id: number;
  message: string;
  timeLabel: string;
  read: boolean;
};

// Hook quản lý dữ liệu dashboard workspace và dự án.
export const useDashboardPage = ({ onOpenAccountSettings, onLogout }: UseDashboardPageParams) => {
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
  const [isEditWorkspaceModalOpen, setIsEditWorkspaceModalOpen] = useState(false);
  const [isDeleteWorkspaceModalOpen, setIsDeleteWorkspaceModalOpen] = useState(false);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<number | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<number | null>(null);
  const [deletingWorkspaceName, setDeletingWorkspaceName] = useState('');
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(null);
  const [deletingProjectName, setDeletingProjectName] = useState('');
  const [editProjectName, setEditProjectName] = useState('');
  const [editProjectDescription, setEditProjectDescription] = useState('');
  const [createWorkspaceError, setCreateWorkspaceError] = useState('');
  const [editWorkspaceError, setEditWorkspaceError] = useState('');
  const [deleteWorkspaceError, setDeleteWorkspaceError] = useState('');
  const [createProjectError, setCreateProjectError] = useState('');
  const [editProjectError, setEditProjectError] = useState('');
  const [deleteProjectError, setDeleteProjectError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectSuccess, setProjectSuccess] = useState('');
  const [workspaceError, setWorkspaceError] = useState('');
  const [userError, setUserError] = useState('');
  const [updatingWorkspace, setUpdatingWorkspace] = useState(false);
  const [deletingWorkspace, setDeletingWorkspace] = useState(false);
  const [updatingProject, setUpdatingProject] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Thành viên' | 'Quản trị viên'>('Thành viên');
  const [inviteError, setInviteError] = useState('');
  const [memberActionError, setMemberActionError] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Xác nhận',
    cancelLabel: 'Hủy',
    isDanger: true,
  });
  const confirmActionRef = useRef<null | (() => Promise<void> | void)>(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);

  const openConfirm = (options: {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDanger?: boolean;
    onConfirm: () => Promise<void> | void;
  }) => {
    confirmActionRef.current = options.onConfirm;
    setConfirmState({
      isOpen: true,
      title: options.title,
      message: options.message,
      confirmLabel: options.confirmLabel ?? 'Xác nhận',
      cancelLabel: options.cancelLabel ?? 'Hủy',
      isDanger: options.isDanger ?? true,
    });
    setIsConfirmSubmitting(false);
  };

  const handleCloseConfirm = () => {
    if (isConfirmSubmitting) {
      return;
    }

    setConfirmState((prev) => ({
      ...prev,
      isOpen: false,
    }));
    confirmActionRef.current = null;
  };

  const handleConfirm = async () => {
    if (!confirmActionRef.current || isConfirmSubmitting) {
      return;
    }

    try {
      setIsConfirmSubmitting(true);
      await confirmActionRef.current();
      setConfirmState((prev) => ({
        ...prev,
        isOpen: false,
      }));
      confirmActionRef.current = null;
    } finally {
      setIsConfirmSubmitting(false);
    }
  };

  // Bảng quy đổi vai trò sang nhãn hiển thị.
  const roleLabelMap: Record<Workspace['role'], string> = {
    Owner: 'Chủ sở hữu',
    Admin: 'Quản trị viên',
    Member: 'Thành viên',
  };

  // Workspace đang được chọn trên dashboard.
  const selectedWorkspace = workspaces.find((item) => item.workspaceId === selectedWorkspaceId) ?? null;
  // Xác định quyền quản lý workspace đang chọn.
  const canManageSelectedWorkspace =
    selectedWorkspace?.role === 'Owner' || selectedWorkspace?.role === 'Admin';
  // Chỉ owner mới được mời admin.
  const canInviteAdmin = selectedWorkspace?.role === 'Owner';
  // Đếm số thông báo chưa đọc.
  const unreadNotifications = notifications.filter((item) => !item.read).length;

  // Thêm thông báo mới vào danh sách.
  const pushNotification = (message: string) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        message,
        timeLabel: new Date().toLocaleString('vi-VN'),
        read: false,
      },
      ...prev,
    ]);
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setNotifications(loadNotifications(currentUser.userId));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    saveNotifications(currentUser.userId, notifications);
  }, [currentUser, notifications]);

  // Kiểm tra quyền cập nhật vai trò thành viên.
  const canManageMemberRole = (member: WorkspaceMember): boolean => {
    if (!selectedWorkspace || !currentUser) {
      return false;
    }

    if (member.userId === currentUser.userId || member.role === 'Owner') {
      return false;
    }

    if (selectedWorkspace.role === 'Owner') {
      return member.role === 'Admin' || member.role === 'Member';
    }

    if (selectedWorkspace.role === 'Admin') {
      return member.role === 'Member';
    }

    return false;
  };

  // Kiểm tra quyền xóa thành viên khỏi workspace.
  const canRemoveMember = (member: WorkspaceMember): boolean => {
    if (!selectedWorkspace || !currentUser) {
      return false;
    }

    if (member.userId === currentUser.userId || member.role === 'Owner') {
      return false;
    }

    if (selectedWorkspace.role === 'Owner') {
      return member.role === 'Admin' || member.role === 'Member';
    }

    if (selectedWorkspace.role === 'Admin') {
      return member.role === 'Member';
    }

    return false;
  };

  useEffect(() => {
    // Tải thông tin người dùng hiện tại.
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
    // Tải danh sách workspace của người dùng.
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

    // Tải danh sách dự án theo workspace được chọn.
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

  useEffect(() => {
    if (!selectedWorkspaceId || !isShareModalOpen) {
      return;
    }

    // Tải thành viên khi mở chia sẻ workspace.
    const loadWorkspaceMembers = async () => {
      try {
        const members = await getWorkspaceMembers(selectedWorkspaceId);
        setWorkspaceMembers(members);
        setMemberActionError('');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Không thể tải danh sách thành viên workspace.';
        setMemberActionError(message);
      }
    };

    void loadWorkspaceMembers();
  }, [selectedWorkspaceId, isShareModalOpen]);

  // Mở modal chia sẻ và nạp danh sách thành viên.
  const handleOpenShareModal = async () => {
    if (!selectedWorkspaceId) {
      setWorkspaceError('Vui lòng chọn không gian làm việc trước khi chia sẻ.');
      return;
    }

    setInviteEmail('');
    setInviteRole('Thành viên');
    setInviteError('');
    setMemberActionError('');
    setIsShareModalOpen(true);

    try {
      const members = await getWorkspaceMembers(selectedWorkspaceId);
      setWorkspaceMembers(members);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải danh sách thành viên workspace.';
      setMemberActionError(message);
    }
  };

  // Gửi lời mời thành viên vào workspace.
  const handleInviteWorkspaceMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedWorkspaceId) {
      setInviteError('Không xác định được workspace để mời thành viên.');
      return;
    }

    const email = inviteEmail.trim();

    if (!email) {
      setInviteError('Vui lòng nhập email thành viên.');
      return;
    }

    try {
      await addWorkspaceMember(selectedWorkspaceId, {
        email,
        role: inviteRole === 'Quản trị viên' ? 'Admin' : 'Member',
      });

      const members = await getWorkspaceMembers(selectedWorkspaceId);
      setWorkspaceMembers(members);
      setInviteEmail('');
      setInviteRole('Thành viên');
      setInviteError('');
      setMemberActionError('');
      pushNotification(`Đã mời ${email} vào workspace.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể mời thành viên workspace.';
      setInviteError(message);
    }
  };

  // Cập nhật vai trò thành viên trong workspace.
  const handleUpdateMemberRole = async (member: WorkspaceMember, role: 'Admin' | 'Member') => {
    if (!selectedWorkspaceId) {
      setMemberActionError('Không xác định được workspace để cập nhật quyền.');
      return;
    }

    try {
      await updateWorkspaceMemberRole(selectedWorkspaceId, member.userId, { role });

      const members = await getWorkspaceMembers(selectedWorkspaceId);
      setWorkspaceMembers(members);
      setMemberActionError('');
      pushNotification(`Đã cập nhật quyền của ${member.fullName}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật quyền thành viên.';
      setMemberActionError(message);
    }
  };

  // Xóa thành viên khỏi workspace.
  const handleRemoveMemberFromWorkspace = async (member: WorkspaceMember) => {
    if (!selectedWorkspaceId) {
      setMemberActionError('Không xác định được workspace để xóa thành viên.');
      return;
    }

    openConfirm({
      title: 'Xóa thành viên',
      message: `Bạn có chắc muốn xóa ${member.fullName} khỏi workspace?`,
      confirmLabel: 'Xóa thành viên',
      onConfirm: async () => {
        try {
          await removeWorkspaceMember(selectedWorkspaceId, member.userId);

          const members = await getWorkspaceMembers(selectedWorkspaceId);
          setWorkspaceMembers(members);
          setMemberActionError('');
          pushNotification(`Đã xóa ${member.fullName} khỏi workspace.`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Không thể xóa thành viên.';
          setMemberActionError(message);
        }
      },
    });
  };

  // Mở modal tạo workspace mới.
  const handleOpenCreateWorkspaceModal = () => {
    setCreateWorkspaceError('');
    setNewWorkspaceName('');
    setIsCreateWorkspaceModalOpen(true);
  };

  // Đóng modal tạo workspace.
  const handleCloseCreateWorkspaceModal = () => {
    if (creatingWorkspace) {
      return;
    }

    setIsCreateWorkspaceModalOpen(false);
    setCreateWorkspaceError('');
    setNewWorkspaceName('');
  };

  // Tạo workspace mới.
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

  // Mở modal sửa workspace.
  const handleOpenEditWorkspaceModal = (workspace: Workspace) => {
    setEditWorkspaceError('');
    setWorkspaceError('');
    setEditingWorkspaceId(workspace.workspaceId);
    setEditWorkspaceName(workspace.name);
    setIsEditWorkspaceModalOpen(true);
  };

  // Đóng modal sửa workspace.
  const handleCloseEditWorkspaceModal = () => {
    if (updatingWorkspace) {
      return;
    }

    setIsEditWorkspaceModalOpen(false);
    setEditWorkspaceError('');
    setEditingWorkspaceId(null);
    setEditWorkspaceName('');
  };

  // Cập nhật thông tin workspace.
  const handleUpdateWorkspace = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingWorkspaceId) {
      setEditWorkspaceError('Không tìm thấy không gian làm việc cần cập nhật.');
      return;
    }

    const trimmedName = editWorkspaceName.trim();

    if (!trimmedName) {
      setEditWorkspaceError('Tên không gian làm việc không được để trống.');
      return;
    }

    if (trimmedName.length < 2) {
      setEditWorkspaceError('Tên không gian làm việc cần ít nhất 2 ký tự.');
      return;
    }

    try {
      setUpdatingWorkspace(true);
      setEditWorkspaceError('');
      setWorkspaceError('');

      const updated = await updateWorkspace(editingWorkspaceId, { name: trimmedName });

      setWorkspaces((prev) =>
        prev.map((item) =>
          item.workspaceId === editingWorkspaceId
            ? {
                ...item,
                name: updated.name,
              }
            : item
        )
      );

      handleCloseEditWorkspaceModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật không gian làm việc.';
      setEditWorkspaceError(message);
    } finally {
      setUpdatingWorkspace(false);
    }
  };

  // Mở modal xác nhận xóa workspace.
  const handleOpenDeleteWorkspaceModal = (workspace: Workspace) => {
    setDeleteWorkspaceError('');
    setWorkspaceError('');
    setDeletingWorkspaceId(workspace.workspaceId);
    setDeletingWorkspaceName(workspace.name);
    setIsDeleteWorkspaceModalOpen(true);
  };

  // Đóng modal xóa workspace.
  const handleCloseDeleteWorkspaceModal = () => {
    if (deletingWorkspace) {
      return;
    }

    setIsDeleteWorkspaceModalOpen(false);
    setDeleteWorkspaceError('');
    setDeletingWorkspaceId(null);
    setDeletingWorkspaceName('');
  };

  // Xóa workspace đang chọn.
  const handleDeleteWorkspace = async () => {
    if (!deletingWorkspaceId) {
      setDeleteWorkspaceError('Không tìm thấy không gian làm việc cần xóa.');
      return;
    }

    try {
      setDeletingWorkspace(true);
      setDeleteWorkspaceError('');
      setWorkspaceError('');

      await deleteWorkspace(deletingWorkspaceId);

      const remaining = workspaces.filter((item) => item.workspaceId !== deletingWorkspaceId);
      setWorkspaces(remaining);

      if (selectedWorkspaceId === deletingWorkspaceId) {
        setSelectedWorkspaceId(remaining[0]?.workspaceId ?? null);
      }

      handleCloseDeleteWorkspaceModal();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể xóa không gian làm việc.';
      setDeleteWorkspaceError(message);
    } finally {
      setDeletingWorkspace(false);
    }
  };

  // Mở modal tạo dự án mới.
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

  // Đóng modal tạo dự án.
  const handleCloseCreateProjectModal = () => {
    if (creatingProject) {
      return;
    }

    setIsCreateProjectModalOpen(false);
    setCreateProjectError('');
    setNewProjectName('');
    setNewProjectDescription('');
  };

  // Tạo dự án mới trong workspace.
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

  // Mở modal sửa dự án.
  const handleOpenEditProjectModal = (project: Project) => {
    setEditProjectError('');
    setProjectSuccess('');
    setEditingProjectId(project.projectId);
    setEditProjectName(project.name);
    setEditProjectDescription(project.description ?? '');
    setIsEditProjectModalOpen(true);
  };

  // Đóng modal sửa dự án.
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

  // Cập nhật thông tin dự án.
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

  // Mở modal xác nhận xóa dự án.
  const handleOpenDeleteProjectModal = (project: Project) => {
    setDeleteProjectError('');
    setProjectSuccess('');
    setDeletingProjectId(project.projectId);
    setDeletingProjectName(project.name);
    setIsDeleteProjectModalOpen(true);
  };

  // Đóng modal xóa dự án.
  const handleCloseDeleteProjectModal = () => {
    if (deletingProject) {
      return;
    }

    setIsDeleteProjectModalOpen(false);
    setDeleteProjectError('');
    setDeletingProjectId(null);
    setDeletingProjectName('');
  };

  // Xóa dự án đang chọn.
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

  // Điều hướng sang quản lý tài khoản và đóng menu.
  const handleOpenAccountSettings = () => {
    setIsAccountMenuOpen(false);
    onOpenAccountSettings();
  };

  // Đăng xuất và đóng menu tài khoản.
  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    onLogout();
  };

  return {
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
    editingWorkspaceId,
    deletingWorkspaceId,
    deletingWorkspaceName,
    editingProjectId,
    deletingProjectId,
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
  };
};
