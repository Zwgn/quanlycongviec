import { useEffect, useMemo, useState } from 'react';
import {
  changePassword,
  CurrentUser,
  getCurrentUser,
  getProjectsByWorkspace,
  getUserWorkspaces,
  Project,
  Workspace,
} from '../services/dashboard.service';

type ProjectWithWorkspace = Project & {
  workspaceId: number;
  workspaceName: string;
  workspaceRole: Workspace['role'];
};

// Hook quản lý dữ liệu trang quản lý tài khoản.
export const useAccountManagementPage = () => {
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
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Lọc danh sách workspace do người dùng sở hữu.
  const ownedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.role === 'Owner'),
    [workspaces]
  );

  // Lọc danh sách workspace tham gia.
  const sharedWorkspaces = useMemo(
    () => workspaces.filter((workspace) => workspace.role === 'Admin' || workspace.role === 'Member'),
    [workspaces]
  );

  useEffect(() => {
    let isMounted = true;

    // Tải dữ liệu người dùng, workspace và project.
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

  // Cập nhật thông tin hồ sơ hiển thị.
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

  // Kiểm tra và lưu thay đổi mật khẩu.
  const handleSubmitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPasswordSubmitting) {
      return;
    }

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

    try {
      setIsPasswordSubmitting(true);
      setPasswordError('');
      setPasswordSuccess('');

      const message = await changePassword({
        currentPassword: currentPasswordDraft,
        newPassword: newPasswordDraft,
      });

      setPasswordSuccess(message || 'Đã cập nhật mật khẩu thành công.');
      setCurrentPasswordDraft('');
      setNewPasswordDraft('');
      setConfirmPasswordDraft('');
      setIsPasswordModalOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      setPasswordError(message);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  // Mở modal đổi mật khẩu và reset input.
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

  return {
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
    workspaces,
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
    ownedWorkspaces,
    sharedWorkspaces,
    handleSubmitProfile,
    handleSubmitPassword,
    handleOpenPasswordModal,
  };
};
