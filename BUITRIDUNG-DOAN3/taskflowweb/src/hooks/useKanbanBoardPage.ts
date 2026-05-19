import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  addProjectMember,
  addTaskAssignee,
  createAttachment,
  createChecklistItem,
  createComment,
  createTask,
  createList,
  CurrentUser,
  deleteAttachment,
  deleteChecklistItem,
  deleteComment,
  deleteTask,
  deleteList,
  getBoardData,
  getCurrentUser,
  getProjectMembers,
  getProjectsByWorkspace,
  getTaskDetail,
  getUserWorkspaces,
  moveChecklistItem,
  moveTask as moveTaskApi,
  removeProjectMember,
  removeTaskAssignee,
  TaskDetailResponse,
  Workspace,
  toggleChecklistItem,
  updateTask,
  updateList,
  updateProjectMemberRole,
} from '../services/dashboard.service';
import { loadNotifications, saveNotifications } from '../utils/notificationStorage';

type UseKanbanBoardPageParams = {
  projectId: number;
  initialProjectName: string;
  onSwitchProject: (projectId: number) => void;
  onOpenAccountSettings: () => void;
  onLogout: () => void;
};

type BoardHubFilter = 'all' | 'workspace';

type BoardTaskItem = {
  taskId: number;
  title: string;
  description?: string;
};

type BoardListItem = {
  listId: number;
  name: string;
  tasks: BoardTaskItem[];
};

type BoardStateData = {
  projectId: number;
  projectName: string;
  lists: BoardListItem[];
};

type BoardMember = {
  id: number;
  fullName: string;
  email: string;
  workspaceRole: Workspace['role'];
  role: 'Chủ sở hữu' | 'Quản trị viên' | 'Thành viên';
  isCurrentUser?: boolean;
};

type NotificationItem = {
  id: number;
  message: string;
  timeLabel: string;
  read: boolean;
};

type TaskLabel = {
  id: number;
  name: string;
  color: string;
};

type TaskChecklistItem = {
  id: number;
  content: string;
  isCompleted: boolean;
  position: number;
};

type TaskAttachment = {
  attachmentId: number;
  fileName: string;
  fileUrl: string;
  createdAt: string;
};

type TaskComment = {
  commentId: number;
  content: string;
  userId: number;
  fullName: string;
  createdAt: string;
};

type TaskActivity = {
  activityId: number;
  action: string;
  userId: number;
  fullName: string;
  createdAt: string;
};

type TaskDetailData = {
  taskId: number;
  listId: number;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
  assignees: Array<{
    userId: number;
    fullName: string;
  }>;
  checklist: TaskChecklistItem[];
  labels: TaskLabel[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  activity: TaskActivity[];
};

// Chuyển đổi vai trò workspace sang nhãn hiển thị.
const mapWorkspaceRoleToLabel = (role: Workspace['role']): BoardMember['role'] => {
  if (role === 'Owner') {
    return 'Chủ sở hữu';
  }

  if (role === 'Admin') {
    return 'Quản trị viên';
  }

  return 'Thành viên';
};

// Hook quản lý toàn bộ trang Kanban Board.
export const useKanbanBoardPage = ({
  projectId,
  initialProjectName,
  onSwitchProject,
  onOpenAccountSettings,
  onLogout,
}: UseKanbanBoardPageParams) => {
  // Tạo dữ liệu board ban đầu theo project.
  const initialBoard = useMemo<BoardStateData>(
    () => ({
      projectId,
      projectName: initialProjectName.trim() || `Project #${projectId}`,
      lists: [],
    }),
    [initialProjectName, projectId]
  );
  const [availableProjects, setAvailableProjects] = useState<Array<{
    workspaceId: number;
    projectId: number;
    projectName: string;
    workspaceName: string;
    workspaceRole: Workspace['role'];
  }>>([]);
  const [projectName, setProjectName] = useState(initialBoard.projectName);
  const [lists, setLists] = useState<BoardListItem[]>(initialBoard.lists);
  const [activeBoardId, setActiveBoardId] = useState<number>(projectId);
  const [isBoardLoading, setIsBoardLoading] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [createListError, setCreateListError] = useState('');
  const [listActionError, setListActionError] = useState('');
  const [taskActionError, setTaskActionError] = useState('');
  const [openTaskComposerListId, setOpenTaskComposerListId] = useState<number | null>(null);
  const [taskDraftByList, setTaskDraftByList] = useState<Record<number, string>>({});
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingListId, setEditingListId] = useState<number | null>(null);
  const [listNameDraftById, setListNameDraftById] = useState<Record<number, string>>({});
  const [isBoardHubOpen, setIsBoardHubOpen] = useState(false);
  const [boardFilter, setBoardFilter] = useState<BoardHubFilter>('all');
  const [boardSearchKeyword, setBoardSearchKeyword] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'Thành viên' | 'Quản trị viên'>('Thành viên');
  const [inviteError, setInviteError] = useState('');
  const [memberActionError, setMemberActionError] = useState('');
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [draggingTask, setDraggingTask] = useState<{ taskId: number; sourceListId: number } | null>(null);
  const [dragOverListId, setDragOverListId] = useState<number | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [taskDetail, setTaskDetail] = useState<TaskDetailData | null>(null);
  const [taskDetailById, setTaskDetailById] = useState<Record<number, TaskDetailData>>({});
  const [taskCommentDraft, setTaskCommentDraft] = useState('');
  const [taskChecklistDraft, setTaskChecklistDraft] = useState('');
  const [taskAttachmentDraft, setTaskAttachmentDraft] = useState('');
  const [taskLabelDraft, setTaskLabelDraft] = useState('');
  const [taskLabelColorDraft, setTaskLabelColorDraft] = useState('#2f74ff');
  const [, setTaskLabelColorByTaskId] = useState<Record<number, string>>({});
  const [taskAssigneeDraft, setTaskAssigneeDraft] = useState('');
  const [previewTaskLabelId, setPreviewTaskLabelId] = useState<number | null>(null);
  const [draggingChecklistItemId, setDraggingChecklistItemId] = useState<number | null>(null);
  const [dragOverChecklistItemId, setDragOverChecklistItemId] = useState<number | null>(null);
  const loadingTaskDetailIdsRef = useRef<Set<number>>(new Set());
  const taskLabelColorByTaskIdRef = useRef<Record<number, string>>({});
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

  const pushNotification = useCallback((message: string) => {
    setNotifications((prev) => [
      {
        id: Date.now(),
        message,
        timeLabel: new Date().toLocaleString('vi-VN'),
        read: false,
      },
      ...prev,
    ]);
  }, []);

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

  // Đồng bộ tiêu đề task trong danh sách.
  const syncTaskTitle = useCallback((taskId: number, listId: number, title: string) => {
    setLists((prev) =>
      prev.map((list) => {
        if (list.listId !== listId) {
          return list;
        }

        const nextTasks = list.tasks.map((task) =>
          task.taskId === taskId && task.title !== title
            ? { ...task, title }
            : task
        );

        return nextTasks === list.tasks ? list : { ...list, tasks: nextTasks };
      })
    );
  }, []);

  // Lưu màu nhãn cho từng task.
  const setTaskLabelColorForTask = useCallback((taskId: number, color: string) => {
    taskLabelColorByTaskIdRef.current = {
      ...taskLabelColorByTaskIdRef.current,
      [taskId]: color,
    };

    setTaskLabelColorByTaskId((prev) => ({
      ...prev,
      [taskId]: color,
    }));
  }, []);

  // Xóa màu nhãn đã lưu của task.
  const removeTaskLabelColorForTask = useCallback((taskId: number) => {
    const next = { ...taskLabelColorByTaskIdRef.current };
    delete next[taskId];
    taskLabelColorByTaskIdRef.current = next;

    setTaskLabelColorByTaskId((prev) => {
      const updated = { ...prev };
      delete updated[taskId];
      return updated;
    });
  }, []);

  // Lấy tên workspace đang chọn theo project.
  const currentWorkspaceName = useMemo(() => {
    const current = availableProjects.find((item) => item.projectId === projectId);
    return current?.workspaceName || 'Không gian làm việc hiện tại';
  }, [availableProjects, projectId]);

  // Lấy vai trò của người dùng trong workspace.
  const currentWorkspaceRole = useMemo<Workspace['role'] | null>(() => {
    const current = availableProjects.find((item) => item.projectId === projectId);
    return current?.workspaceRole ?? null;
  }, [availableProjects, projectId]);

  // Lấy vai trò hiện tại dựa trên thành viên project.
  const currentProjectRole = useMemo<Workspace['role'] | null>(() => {
    const currentMember = boardMembers.find((member) => member.isCurrentUser);
    return currentMember?.workspaceRole ?? currentWorkspaceRole;
  }, [boardMembers, currentWorkspaceRole]);

  // Kiểm tra quyền quản lý workspace hiện tại.
  const canManageWorkspace =
    currentProjectRole === 'Owner' || currentProjectRole === 'Admin';
  // Chỉ owner mới được mời admin.
  const canInviteAdmin = currentProjectRole === 'Owner';

  // Chuyển đổi thành viên từ API sang dữ liệu UI.
  const mapWorkspaceMember = useCallback(
    (member: { userId: number; fullName: string; email: string; role: Workspace['role'] }): BoardMember => ({
      id: member.userId,
      fullName: member.fullName,
      email: member.email,
      workspaceRole: member.role,
      role: mapWorkspaceRoleToLabel(member.role),
      isCurrentUser: member.userId === currentUser?.userId,
    }),
    [currentUser?.userId]
  );

  // Kiểm tra quyền cập nhật vai trò thành viên.
  const canManageMemberRole = useCallback(
    (member: BoardMember): boolean => {
      if (!canManageWorkspace) {
        return false;
      }

      if (member.workspaceRole === 'Owner') {
        return false;
      }

      if (currentProjectRole === 'Owner') {
        return true;
      }

      return currentProjectRole === 'Admin' && member.workspaceRole === 'Member';
    },
    [canManageWorkspace, currentProjectRole]
  );

  // Kiểm tra quyền xóa thành viên khỏi project.
  const canRemoveMember = useCallback(
    (member: BoardMember): boolean => {
      if (!canManageMemberRole(member)) {
        return false;
      }

      return !member.isCurrentUser;
    },
    [canManageMemberRole]
  );

  // Tải lại danh sách thành viên trong project.
  const refreshWorkspaceMembers = useCallback(async () => {
    if (!currentUser || !projectId || Number.isNaN(projectId)) {
      return;
    }

    const members = await getProjectMembers(projectId);
    setBoardMembers(members.map(mapWorkspaceMember));
  }, [currentUser, mapWorkspaceMember, projectId]);

  // Lọc danh sách board theo bộ lọc và từ khóa.
  const filteredBoardItems = useMemo(() => {
    const keyword = boardSearchKeyword.trim().toLowerCase();

    return availableProjects.filter((item) => {
      if (boardFilter === 'workspace' && item.workspaceName !== currentWorkspaceName) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        item.projectName.toLowerCase().includes(keyword) ||
        item.workspaceName.toLowerCase().includes(keyword)
      );
    });
  }, [availableProjects, boardFilter, boardSearchKeyword, currentWorkspaceName]);

  useEffect(() => {
    let isMounted = true;

    // Tải danh sách project theo workspace.
    const loadAvailableProjects = async () => {
      try {
        const workspaces = await getUserWorkspaces();
        const fallbackWorkspaceName = workspaces[0]?.name || 'Không gian làm việc hiện tại';
        const projectGroups = await Promise.all(
          workspaces.map(async (workspace) => ({
            workspaceId: workspace.workspaceId,
            workspaceName: workspace.name,
            projects: await getProjectsByWorkspace(workspace.workspaceId),
          }))
        );

        if (!isMounted) {
          return;
        }

        const uniqueProjects = new Map<
          number,
          {
            workspaceId: number;
            projectId: number;
            projectName: string;
            workspaceName: string;
            workspaceRole: Workspace['role'];
          }
        >();

        projectGroups.forEach((group) => {
          group.projects.forEach((project) => {
            uniqueProjects.set(project.projectId, {
              workspaceId: group.workspaceId,
              projectId: project.projectId,
              projectName: project.name,
              workspaceName: group.workspaceName,
              workspaceRole: workspaces.find((workspace) => workspace.workspaceId === group.workspaceId)?.role ?? 'Member',
            });
          });
        });

        if (!uniqueProjects.has(projectId)) {
          uniqueProjects.set(projectId, {
            workspaceId: workspaces[0]?.workspaceId ?? 0,
            projectId,
            projectName: initialBoard.projectName,
            workspaceName: fallbackWorkspaceName,
            workspaceRole: workspaces[0]?.role ?? 'Member',
          });
        }

        setAvailableProjects(Array.from(uniqueProjects.values()));
      } catch (_error) {
        if (!isMounted) {
          return;
        }

        setAvailableProjects([
          {
            workspaceId: 0,
            projectId,
            projectName: initialBoard.projectName,
            workspaceName: 'Không gian làm việc hiện tại',
            workspaceRole: 'Member',
          },
        ]);
      }
    };

    void loadAvailableProjects();

    return () => {
      isMounted = false;
    };
  }, [initialBoard.projectName, projectId]);

  // Lấy danh sách board gần đây ưu tiên board hiện tại.
  const recentBoardItems = useMemo(() => {
    const current = filteredBoardItems.find((item) => item.projectId === projectId);
    const others = filteredBoardItems.filter((item) => item.projectId !== projectId);

    return current ? [current, ...others].slice(0, 4) : others.slice(0, 4);
  }, [filteredBoardItems, projectId]);

  useEffect(() => {
    setProjectName(initialBoard.projectName);
    setLists(initialBoard.lists);
    setActiveBoardId(projectId);
    setBoardError('');
    setCreateListError('');
    setListActionError('');
    setOpenTaskComposerListId(null);
    setTaskDraftByList({});
    setIsAddingList(false);
    setNewListName('');
    setIsBoardHubOpen(false);
    setBoardFilter('all');
    setBoardSearchKeyword('');
    setPreviewTaskLabelId(null);
  }, [initialBoard, projectId]);

  useEffect(() => {
    let isMounted = true;

    // Tải dữ liệu board theo project.
    const loadBoardData = async () => {
      if (!projectId || Number.isNaN(projectId)) {
        return;
      }

      setIsBoardLoading(true);
      setBoardError('');

      try {
        const boardData = await getBoardData(projectId);

        if (!isMounted) {
          return;
        }

        setActiveBoardId(boardData.boardId);
        setProjectName(boardData.name);
        setLists(
          boardData.lists.map((list) => ({
            listId: list.listId,
            name: list.name,
            tasks: list.tasks
              .sort((a, b) => a.position - b.position)
              .map((task) => ({
                taskId: task.taskId,
                title: task.title,
              })),
          }))
        );
        setTaskActionError('');
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Không thể tải dữ liệu bảng.';
        setBoardError(message);
      } finally {
        if (isMounted) {
          setIsBoardLoading(false);
        }
      }
    };

    void loadBoardData();

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  // Đếm số thông báo chưa đọc.
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

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

  useEffect(() => {
    // Tải thông tin người dùng hiện tại.
    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (_error) {
        const rawUser = localStorage.getItem('taskflow_user');

        if (rawUser) {
          try {
            const parsed = JSON.parse(rawUser) as Partial<CurrentUser>;
            if (parsed.fullName && parsed.email) {
              const fallbackUser: CurrentUser = {
                userId: Number(parsed.userId ?? 0),
                fullName: parsed.fullName,
                email: parsed.email,
              };
              setCurrentUser(fallbackUser);
            }
          } catch (_parseError) {
            setCurrentUser(null);
          }
        }
      }
    };

    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setBoardMembers([]);
      return;
    }

    if (!projectId || Number.isNaN(projectId)) {
      setBoardMembers([
        {
          id: currentUser.userId,
          fullName: currentUser.fullName,
          email: currentUser.email,
          workspaceRole: currentWorkspaceRole ?? 'Member',
          role: currentWorkspaceRole ? mapWorkspaceRoleToLabel(currentWorkspaceRole) : 'Thành viên',
          isCurrentUser: true,
        },
      ]);
      return;
    }

    let isMounted = true;

    // Tải danh sách thành viên của project.
    const loadWorkspaceMembers = async () => {
      try {
        if (!isMounted) {
          return;
        }

        await refreshWorkspaceMembers();
      } catch (_error) {
        if (!isMounted) {
          return;
        }

        setBoardMembers([
          {
            id: currentUser.userId,
            fullName: currentUser.fullName,
            email: currentUser.email,
            workspaceRole: currentWorkspaceRole ?? 'Member',
            role: currentWorkspaceRole ? mapWorkspaceRoleToLabel(currentWorkspaceRole) : 'Thành viên',
            isCurrentUser: true,
          },
        ]);
      }
    };

    void loadWorkspaceMembers();

    return () => {
      isMounted = false;
    };
  }, [currentWorkspaceRole, currentUser, projectId, refreshWorkspaceMembers]);

  useEffect(() => {
    if (!boardError) {
      return;
    }

    window.alert(boardError);
    setBoardError('');
  }, [boardError]);

  useEffect(() => {
    if (!createListError) {
      return;
    }

    window.alert(createListError);
    setCreateListError('');
  }, [createListError]);

  useEffect(() => {
    if (!listActionError) {
      return;
    }

    window.alert(listActionError);
    setListActionError('');
  }, [listActionError]);

  useEffect(() => {
    if (!taskActionError) {
      return;
    }

    window.alert(taskActionError);
    setTaskActionError('');
  }, [taskActionError]);

  useEffect(() => {
    if (!inviteError) {
      return;
    }

    window.alert(inviteError);
    setInviteError('');
  }, [inviteError]);

  useEffect(() => {
    if (!memberActionError) {
      return;
    }

    window.alert(memberActionError);
    setMemberActionError('');
  }, [memberActionError]);

  // Mở giao diện thêm danh sách mới.
  const handleOpenAddList = () => {
    setIsAddingList(true);
    setNewListName('');
  };

  // Tạo danh sách mới trên board.
  const handleSubmitAddList = async () => {
    const trimmed = newListName.trim();

    if (!trimmed) {
      setCreateListError('Vui lòng nhập tên danh sách nhiệm vụ.');
      return;
    }

    try {
      setCreateListError('');
      setListActionError('');

      const created = await createList({
        name: trimmed,
        boardId: activeBoardId,
      });

      const nextList: BoardListItem = {
        listId: created.listId,
        name: created.name,
        tasks: [],
      };

      setLists((prev) => [...prev, nextList]);
      setNewListName('');
      setIsAddingList(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể tạo danh sách nhiệm vụ.';
      setCreateListError(message);
    }
  };

  // Bắt đầu chỉnh sửa tiêu đề list.
  const handleStartEditList = (listId: number, currentName: string) => {
    if (!canManageWorkspace) {
      return;
    }

    setEditingListId(listId);
    setListNameDraftById((prev) => ({
      ...prev,
      [listId]: currentName,
    }));
  };

  // Cập nhật tiêu đề list đang chỉnh sửa.
  const handleListNameDraftChange = (listId: number, value: string) => {
    setListNameDraftById((prev) => ({
      ...prev,
      [listId]: value,
    }));
  };

  // Hủy chỉnh sửa tiêu đề list.
  const handleCancelEditList = (listId: number) => {
    const current = lists.find((list) => list.listId === listId);

    setEditingListId((prev) => (prev === listId ? null : prev));
    setListNameDraftById((prev) => ({
      ...prev,
      [listId]: current?.name ?? prev[listId] ?? '',
    }));
  };

  // Lưu tiêu đề list mới.
  const handleSubmitListName = async (listId: number) => {
    const draft = (listNameDraftById[listId] ?? '').trim();

    if (!draft) {
      setListActionError('Vui lòng nhập tên danh sách nhiệm vụ.');
      return;
    }

    const current = lists.find((list) => list.listId === listId);

    if (!current) {
      setListActionError('Không tìm thấy danh sách nhiệm vụ để cập nhật.');
      return;
    }

    if (current.name === draft) {
      setEditingListId(null);
      return;
    }

    try {
      setListActionError('');

      const updated = await updateList(listId, { name: draft });

      setLists((prev) =>
        prev.map((list) =>
          list.listId === listId ? { ...list, name: updated.name } : list
        )
      );
      setEditingListId(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể cập nhật tên danh sách nhiệm vụ.';
      setListActionError(message);
    }
  };

  // Xóa danh sách và tải lại board.
  const handleDeleteList = (listId: number, listName: string) => {
    openConfirm({
      title: 'Xóa danh sách',
      message: `Bạn có chắc muốn xóa danh sách "${listName}"?`,
      confirmLabel: 'Xóa danh sách',
      onConfirm: async () => {
        try {
          setListActionError('');
          await deleteList(listId);

          const boardData = await getBoardData(projectId);

          setActiveBoardId(boardData.boardId);
          setProjectName(boardData.name);
          setLists(
            boardData.lists.map((list) => ({
              listId: list.listId,
              name: list.name,
              tasks: list.tasks
                .sort((a, b) => a.position - b.position)
                .map((task) => ({
                  taskId: task.taskId,
                  title: task.title,
                })),
            }))
          );

          if (openTaskComposerListId === listId) {
            setOpenTaskComposerListId(null);
          }

          setTaskDraftByList((prev) => {
            const next = { ...prev };
            delete next[listId];
            return next;
          });

          setEditingListId((prev) => (prev === listId ? null : prev));
          setListNameDraftById((prev) => {
            const next = { ...prev };
            delete next[listId];
            return next;
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : 'Không thể xóa danh sách nhiệm vụ.';
          setListActionError(message);
        }
      },
    });
  };

  // Mở ô nhập task cho một list.
  const handleOpenTaskComposer = (listId: number) => {
    setOpenTaskComposerListId(listId);
    setTaskDraftByList((prev) => ({
      ...prev,
      [listId]: prev[listId] ?? '',
    }));
  };

  // Cập nhật nội dung task đang soạn.
  const handleTaskDraftChange = (listId: number, value: string) => {
    setTaskDraftByList((prev) => ({
      ...prev,
      [listId]: value,
    }));
  };

  // Hủy soạn task và đóng ô nhập.
  const handleCancelTaskComposer = (listId: number) => {
    setOpenTaskComposerListId(null);
    setTaskDraftByList((prev) => ({
      ...prev,
      [listId]: '',
    }));
  };

  // Tạo task mới trong list.
  const handleSubmitAddTask = async (listId: number) => {
    const trimmed = (taskDraftByList[listId] ?? '').trim();

    if (!trimmed) {
      return;
    }

    try {
      await createTask({ title: trimmed, listId });

      const boardData = await getBoardData(projectId);

      setActiveBoardId(boardData.boardId);
      setProjectName(boardData.name);
      setLists(
        boardData.lists.map((list) => ({
          listId: list.listId,
          name: list.name,
          tasks: list.tasks
            .sort((a, b) => a.position - b.position)
            .map((task) => ({
              taskId: task.taskId,
              title: task.title,
            })),
        }))
      );

      setTaskDraftByList((prev) => ({
        ...prev,
        [listId]: '',
      }));
      setOpenTaskComposerListId(null);
      setTaskActionError('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể tạo nhiệm vụ.';
      setTaskActionError(message);
    }
  };

  // Di chuyển task giữa các list.
  const moveTask = async (targetListId: number, targetTaskId?: number) => {
    if (!draggingTask) {
      return;
    }

    const { taskId, sourceListId } = draggingTask;

    if (sourceListId === targetListId && targetTaskId === taskId) {
      return;
    }

    const targetList = lists.find((list) => list.listId === targetListId);
    if (!targetList) {
      return;
    }

    const targetTasksWithoutMoved = targetList.tasks.filter((task) => task.taskId !== taskId);
    const insertIndex = targetTaskId
      ? Math.max(
          targetTasksWithoutMoved.findIndex((task) => task.taskId === targetTaskId),
          0
        )
      : targetTasksWithoutMoved.length;
    const position = insertIndex + 1;

    try {
      await moveTaskApi(taskId, {
        targetListId,
        position,
      });

      const boardData = await getBoardData(projectId);

      setActiveBoardId(boardData.boardId);
      setProjectName(boardData.name);
      setLists(
        boardData.lists.map((list) => ({
          listId: list.listId,
          name: list.name,
          tasks: list.tasks
            .sort((a, b) => a.position - b.position)
            .map((task) => ({
              taskId: task.taskId,
              title: task.title,
            })),
        }))
      );
      setTaskActionError('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể di chuyển nhiệm vụ.';
      setTaskActionError(message);
    }
  };

  // Mời thành viên vào project.
  const handleInviteMember = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = inviteEmail.trim().toLowerCase();

    if (!email) {
      setInviteError('Vui lòng nhập email thành viên.');
      return;
    }

    const isEmailFormatValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailFormatValid) {
      setInviteError('Email không hợp lệ.');
      return;
    }

    const isExisted = boardMembers.some((member) => member.email.toLowerCase() === email);
    if (isExisted) {
      setInviteError('Thành viên đã có trong bảng.');
      return;
    }

    if (!projectId || Number.isNaN(projectId)) {
      setInviteError('Không xác định được dự án để mời thành viên.');
      return;
    }

    try {
      await addProjectMember(projectId, {
        email,
        role: inviteRole === 'Quản trị viên' ? 'Admin' : 'Member',
      });

      await refreshWorkspaceMembers();

      pushNotification(`Đã mời ${email} vào project.`);

      setInviteEmail('');
      setInviteRole('Thành viên');
      setInviteError('');
      setMemberActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể mời thành viên.';
      setInviteError(message);
    }
  };

  // Cập nhật vai trò thành viên trong project.
  const handleUpdateMemberRole = async (member: BoardMember, role: Workspace['role']) => {
    if (!projectId || Number.isNaN(projectId)) {
      setMemberActionError('Không xác định được dự án để cập nhật quyền thành viên.');
      return;
    }

    if (!canManageMemberRole(member)) {
      setMemberActionError('Bạn không có quyền cập nhật vai trò của thành viên này.');
      return;
    }

    if (role === member.workspaceRole || role === 'Owner') {
      return;
    }

    try {
      await updateProjectMemberRole(projectId, member.id, { role });
      await refreshWorkspaceMembers();
      setMemberActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật quyền thành viên.';
      setMemberActionError(message);
    }
  };

  // Xóa thành viên khỏi project.
  const handleRemoveMemberFromWorkspace = async (member: BoardMember) => {
    if (!projectId || Number.isNaN(projectId)) {
      setMemberActionError('Không xác định được dự án để xóa thành viên.');
      return;
    }

    if (!canRemoveMember(member)) {
      setMemberActionError('Bạn không có quyền xóa thành viên này.');
      return;
    }

    openConfirm({
      title: 'Xóa thành viên',
      message: `Bạn có chắc muốn xóa ${member.fullName} khỏi project?`,
      confirmLabel: 'Xóa thành viên',
      onConfirm: async () => {
        try {
          await removeProjectMember(projectId, member.id);
          await refreshWorkspaceMembers();
          setMemberActionError('');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Không thể xóa thành viên.';
          setMemberActionError(message);
        }
      },
    });
  };

  // Mở bảng thông báo và đánh dấu đã đọc.
  const handleOpenNotificationPanel = () => {
    setIsNotificationPanelOpen((prev) => !prev);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  // Định dạng ngày giờ cho input datetime-local.
  const formatLocalDateTime = (date: Date): string => {
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

  // Chuẩn hóa giá trị ngày cho ô nhập.
  const toDateInputValue = (rawDate: string): string => {
    if (!rawDate) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rawDate)) {
      return rawDate;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(rawDate)) {
      return rawDate.slice(0, 16);
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return formatLocalDateTime(parsed);
  };

  // Chuẩn hóa ngày giờ gửi lên server.
  const toServerDateTime = (value: string): string | null => {
    if (!value) {
      return null;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
      return `${value}:00`;
    }

    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)) {
      return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return `${formatLocalDateTime(parsed)}:00`;
  };

  // Chuyển đổi chi tiết task từ API sang UI.
  const mapTaskDetailFromApi = useCallback((data: TaskDetailResponse): TaskDetailData => {
    const labelName = data.label?.trim();
    const resolvedLabelColor = taskLabelColorByTaskIdRef.current[data.taskId] ?? '#2f74ff';

    return {
      taskId: data.taskId,
      listId: data.listId,
      title: data.title,
      description: data.description ?? '',
      dueDate: data.dueDate ?? '',
      priority: (data.priority as 'low' | 'medium' | 'high' | null) ?? 'medium',
      status: (data.status as 'todo' | 'doing' | 'done' | null) ?? 'todo',
      createdAt: data.createdAt,
      assignees: data.assignees ?? [],
      checklist: (data.checklist ?? []).sort((a, b) => a.position - b.position),
      labels: labelName
        ? [
            {
              id: 1,
              name: labelName,
              color: resolvedLabelColor,
            },
          ]
        : [],
      attachments: (data.attachments ?? []).map((item) => ({
        ...item,
        fileName: item.fileName ?? 'attachment',
        fileUrl: item.fileUrl ?? '',
      })),
      comments: data.comments ?? [],
      activity: (data.activity ?? []).map((item) => ({
        ...item,
        action: item.action ?? '',
      })),
    };
  }, []);

  useEffect(() => {
    const taskIds = lists.flatMap((list) => list.tasks.map((task) => task.taskId));
    const missingTaskIds = taskIds.filter(
      (taskId) => !taskDetailById[taskId] && !loadingTaskDetailIdsRef.current.has(taskId)
    );

    if (missingTaskIds.length === 0) {
      return;
    }

    const currentLoadingIds = loadingTaskDetailIdsRef.current;

    missingTaskIds.forEach((taskId) => {
      currentLoadingIds.add(taskId);
    });

    let cancelled = false;

    // Tải bổ sung chi tiết các task còn thiếu.
    const loadMissingTaskDetails = async () => {
      const results = await Promise.allSettled(
        missingTaskIds.map((taskId) => getTaskDetail(taskId))
      );

      if (cancelled) {
        return;
      }

      setTaskDetailById((prev) => {
        const next = { ...prev };

        results.forEach((result, index) => {
          const taskId = missingTaskIds[index];
          if (result.status === 'fulfilled') {
            next[taskId] = mapTaskDetailFromApi(result.value);
          }
        });

        return next;
      });

      missingTaskIds.forEach((taskId) => {
        currentLoadingIds.delete(taskId);
      });
    };

    void loadMissingTaskDetails();

    return () => {
      cancelled = true;
      missingTaskIds.forEach((taskId) => {
        currentLoadingIds.delete(taskId);
      });
    };
  }, [lists, taskDetailById, mapTaskDetailFromApi]);

  // Cập nhật cache chi tiết task đang mở.
  const updateTaskDetailCache = (next: TaskDetailData) => {
    setTaskDetail(next);
    setTaskDetailById((prev) => ({
      ...prev,
      [next.taskId]: next,
    }));
    syncTaskTitle(next.taskId, next.listId, next.title);
  };

  // Tải lại chi tiết task từ server.
  const refreshTaskDetail = async (taskId: number): Promise<TaskDetailData> => {
    const raw = await getTaskDetail(taskId);
    const mapped = mapTaskDetailFromApi(raw);
    updateTaskDetailCache(mapped);
    return mapped;
  };

  // Tải lại chi tiết task và trả về trạng thái an toàn.
  const refreshTaskDetailSafely = async (taskId: number): Promise<boolean> => {
    try {
      await refreshTaskDetail(taskId);
      return true;
    } catch (_error) {
      return false;
    }
  };

  // Cập nhật chi tiết task theo updater.
  const updateTaskDetailState = (updater: (current: TaskDetailData) => TaskDetailData) => {
    setTaskDetail((current) => {
      if (!current) {
        return current;
      }

      const next = updater(current);

      if (next.title !== current.title) {
        syncTaskTitle(next.taskId, next.listId, next.title);
      }

      setTaskDetailById((prev) => ({
        ...prev,
        [next.taskId]: next,
      }));

      return next;
    });
  };

  // Mở chi tiết task và tải dữ liệu nếu cần.
  const handleOpenTaskDetail = async (_listId: number, task: BoardTaskItem) => {
    const cached = taskDetailById[task.taskId];
    if (cached) {
      setTaskDetail(cached);
      setIsTaskDetailOpen(true);
    }

    setTaskCommentDraft('');
    setTaskChecklistDraft('');
    setTaskAttachmentDraft('');
    setTaskLabelDraft('');
    setTaskLabelColorDraft(taskLabelColorByTaskIdRef.current[task.taskId] ?? '#2f74ff');
    setTaskAssigneeDraft('');

    try {
      await refreshTaskDetail(task.taskId);
      setIsTaskDetailOpen(true);
      setTaskActionError('');
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể tải chi tiết nhiệm vụ.';
      setTaskActionError(message);
    }
  };

  // Đóng modal chi tiết task.
  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false);
    setTaskDetail(null);
  };

  // Xóa thẻ task và cập nhật board.
  const handleDeleteTaskCard = async (taskId: number, listId: number) => {
    openConfirm({
      title: 'Xóa nhiệm vụ',
      message: 'Bạn có chắc muốn xóa nhiệm vụ này không?',
      confirmLabel: 'Xóa nhiệm vụ',
      onConfirm: async () => {
        try {
          await deleteTask(taskId);

          const boardData = await getBoardData(projectId);

          setActiveBoardId(boardData.boardId);
          setProjectName(boardData.name);
          setLists(
            boardData.lists.map((list) => ({
              listId: list.listId,
              name: list.name,
              tasks: list.tasks
                .sort((a, b) => a.position - b.position)
                .map((task) => ({
                  taskId: task.taskId,
                  title: task.title,
                })),
            }))
          );

          setTaskDetailById((prev) => {
            const next = { ...prev };
            delete next[taskId];
            return next;
          });

          if (taskDetail?.taskId === taskId) {
            handleCloseTaskDetail();
          }

          setTaskActionError('');
        } catch (error: unknown) {
          const rawMessage = error instanceof Error ? error.message : '';
          const message = rawMessage.toLowerCase().includes('không có quyền')
            ? 'Bạn không có quyền xóa nhiệm vụ này'
            : rawMessage || 'Không thể xóa nhiệm vụ.';
          window.alert(message);
          setTaskActionError('');
        }
      },
    });
  };

  // Thêm mục checklist vào task.
  const handleAddChecklistItem = async () => {
    const content = taskChecklistDraft.trim();
    if (!content || !taskDetail) {
      return;
    }

    try {
      await createChecklistItem({
        taskId: taskDetail.taskId,
        content,
      });

      await refreshTaskDetailSafely(taskDetail.taskId);
      setTaskChecklistDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm mục kiểm tra.';
      setTaskActionError(message);
    }
  };

  // Đổi trạng thái hoàn thành của checklist.
  const handleToggleChecklistItem = async (itemId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await toggleChecklistItem(itemId);
      await refreshTaskDetailSafely(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật mục kiểm tra.';
      setTaskActionError(message);
    }
  };

  // Xóa mục checklist khỏi task.
  const handleDeleteChecklistItem = (itemId: number) => {
    if (!taskDetail) {
      return;
    }

    openConfirm({
      title: 'Xóa mục checklist',
      message: 'Bạn có chắc muốn xóa mục checklist này không?',
      confirmLabel: 'Xóa mục',
      onConfirm: async () => {
        try {
          await deleteChecklistItem(itemId);
          await refreshTaskDetailSafely(taskDetail.taskId);
          setTaskActionError('');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Không thể xóa mục kiểm tra.';
          setTaskActionError(message);
        }
      },
    });
  };

  // Di chuyển vị trí mục checklist.
  const handleMoveChecklistItem = async (itemId: number, targetPosition: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await moveChecklistItem(itemId, { position: targetPosition });
      await refreshTaskDetailSafely(taskDetail.taskId);
      setDraggingChecklistItemId(null);
      setDragOverChecklistItemId(null);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể di chuyển mục kiểm tra.';
      setTaskActionError(message);
    }
  };

  // Xử lý thả checklist khi kéo thả.
  const handleDropChecklistItem = async (targetItemId: number) => {
    if (!taskDetail || !draggingChecklistItemId || draggingChecklistItemId === targetItemId) {
      setDraggingChecklistItemId(null);
      setDragOverChecklistItemId(null);
      return;
    }

    const sourceIndex = taskDetail.checklist.findIndex((item) => item.id === draggingChecklistItemId);
    const targetIndex = taskDetail.checklist.findIndex((item) => item.id === targetItemId);

    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
      setDraggingChecklistItemId(null);
      setDragOverChecklistItemId(null);
      return;
    }

    const targetPosition = sourceIndex < targetIndex ? targetIndex : targetIndex + 1;
    await handleMoveChecklistItem(draggingChecklistItemId, targetPosition);
  };

  // Thêm bình luận cho task.
  const handleAddTaskComment = async () => {
    const content = taskCommentDraft.trim();
    if (!content || !taskDetail) {
      return;
    }

    try {
      await createComment({
        taskId: taskDetail.taskId,
        content,
      });

      await refreshTaskDetailSafely(taskDetail.taskId);
      setTaskCommentDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm bình luận.';
      setTaskActionError(message);
    }
  };

  // Xóa bình luận khỏi task.
  const handleDeleteTaskComment = (commentId: number) => {
    if (!taskDetail) {
      return;
    }

    openConfirm({
      title: 'Xóa bình luận',
      message: 'Bạn có chắc muốn xóa bình luận này không?',
      confirmLabel: 'Xóa bình luận',
      onConfirm: async () => {
        try {
          await deleteComment(commentId);
          await refreshTaskDetailSafely(taskDetail.taskId);
          setTaskActionError('');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Không thể xóa bình luận.';
          setTaskActionError(message);
        }
      },
    });
  };

  // Thêm tệp đính kèm cho task.
  const handleAddAttachment = async () => {
    const fileUrl = taskAttachmentDraft.trim();
    if (!fileUrl || !taskDetail) {
      return;
    }

    const guessedName = fileUrl.split('/').pop() || `attachment-${Date.now()}`;

    try {
      const createdAttachment = await createAttachment({
        taskId: taskDetail.taskId,
        fileName: guessedName,
        fileUrl,
      });

      try {
        await refreshTaskDetail(taskDetail.taskId);
      } catch (_refreshError) {
        const created = createdAttachment as Partial<TaskAttachment>;
        const fallbackAttachment: TaskAttachment = {
          attachmentId: Number(created.attachmentId ?? Date.now()),
          fileName: created.fileName || guessedName,
          fileUrl: created.fileUrl || fileUrl,
          createdAt: created.createdAt || new Date().toISOString(),
        };

        updateTaskDetailState((current) => ({
          ...current,
          attachments: [fallbackAttachment, ...current.attachments],
        }));
        setTaskActionError('');
      }

      setTaskAttachmentDraft('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm đính kèm.';
      setTaskActionError(message);
    }
  };

  // Xóa tệp đính kèm khỏi task.
  const handleDeleteTaskAttachment = (attachmentId: number) => {
    if (!taskDetail) {
      return;
    }

    openConfirm({
      title: 'Xóa đính kèm',
      message: 'Bạn có chắc muốn xóa tệp đính kèm này không?',
      confirmLabel: 'Xóa đính kèm',
      onConfirm: async () => {
        try {
          await deleteAttachment(attachmentId);
          await refreshTaskDetailSafely(taskDetail.taskId);
          setTaskActionError('');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Không thể xóa file đính kèm.';
          setTaskActionError(message);
        }
      },
    });
  };

  // Thêm nhãn cho task.
  const handleAddLabel = async () => {
    const labelName = taskLabelDraft.trim();
    if (!labelName || !taskDetail) {
      return;
    }

    const selectedLabelColor = taskLabelColorDraft;

    try {
      await updateTask(taskDetail.taskId, {
        label: labelName,
      });

      setTaskLabelColorForTask(taskDetail.taskId, selectedLabelColor);

      await refreshTaskDetailSafely(taskDetail.taskId);
      setTaskLabelDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm nhãn.';
      setTaskActionError(message);
    }
  };

  // Xóa nhãn khỏi task.
  const handleRemoveLabel = (_labelId: number) => {
    if (!taskDetail) {
      return;
    }

    openConfirm({
      title: 'Xóa nhãn',
      message: 'Bạn có chắc muốn xóa nhãn khỏi nhiệm vụ này không?',
      confirmLabel: 'Xóa nhãn',
      onConfirm: async () => {
        try {
          await updateTask(taskDetail.taskId, {
            label: null,
          });

          removeTaskLabelColorForTask(taskDetail.taskId);

          await refreshTaskDetailSafely(taskDetail.taskId);
          setTaskActionError('');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Không thể xóa nhãn.';
          setTaskActionError(message);
        }
      },
    });
  };

  // Thêm người được giao vào task.
  const handleAddAssignee = async () => {
    const assigneeId = Number(taskAssigneeDraft);
    if (!assigneeId || Number.isNaN(assigneeId)) {
      return;
    }

    const selectedMember = boardMembers.find((member) => member.id === assigneeId);
    if (!selectedMember || !taskDetail) {
      return;
    }

    try {
      await addTaskAssignee({
        taskId: taskDetail.taskId,
        assigneeUserId: selectedMember.id,
      });

      await refreshTaskDetailSafely(taskDetail.taskId);
      setTaskAssigneeDraft('');
      setTaskActionError('');

      pushNotification(`Đã giao "${taskDetail.title}" cho ${selectedMember.fullName}.`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm thành viên vào nhiệm vụ.';
      setTaskActionError(message);
    }
  };

  // Xóa người được giao khỏi task.
  const handleRemoveAssignee = (userId: number) => {
    if (!taskDetail) {
      return;
    }

    openConfirm({
      title: 'Xóa người được giao',
      message: 'Bạn có chắc muốn xóa người được giao khỏi nhiệm vụ này không?',
      confirmLabel: 'Xóa người được giao',
      onConfirm: async () => {
        try {
          await removeTaskAssignee({
            taskId: taskDetail.taskId,
            assigneeUserId: userId,
          });

          await refreshTaskDetailSafely(taskDetail.taskId);
          setTaskActionError('');
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Không thể xóa thành viên khỏi nhiệm vụ.';
          setTaskActionError(message);
        }
      },
    });
  };

  // Lưu cập nhật task và thông báo lỗi nếu có.
  const persistTaskUpdate = async (
    payload: {
      title?: string;
      description?: string;
      dueDate?: string | null;
      label?: string | null;
      priority?: 'low' | 'medium' | 'high';
    },
    fallbackMessage: string
  ) => {
    if (!taskDetail) {
      return;
    }

    try {
      await updateTask(taskDetail.taskId, payload);
      await refreshTaskDetailSafely(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : fallbackMessage;
      setTaskActionError(message);
    }
  };

  // Lưu tiêu đề task sau khi chỉnh sửa.
  const handlePersistTaskTitle = async () => {
    if (!taskDetail) {
      return;
    }

    const title = taskDetail.title.trim();
    if (!title) {
      setTaskActionError('Tiêu đề nhiệm vụ không được để trống.');
      return;
    }

    await persistTaskUpdate({ title }, 'Không thể cập nhật tiêu đề nhiệm vụ.');
  };

  // Lưu mô tả task sau khi chỉnh sửa.
  const handlePersistTaskDescription = async () => {
    if (!taskDetail) {
      return;
    }

    await persistTaskUpdate(
      { description: taskDetail.description.trim() },
      'Không thể cập nhật mô tả nhiệm vụ.'
    );
  };

  // Lưu hạn chót task sau khi chỉnh sửa.
  const handlePersistTaskDueDate = async () => {
    if (!taskDetail) {
      return;
    }

    await persistTaskUpdate(
      { dueDate: toServerDateTime(taskDetail.dueDate) },
      'Không thể cập nhật hạn chót nhiệm vụ.'
    );
  };

  // Lưu mức độ ưu tiên task.
  const handlePersistTaskPriority = async (priority: 'low' | 'medium' | 'high') => {
    await persistTaskUpdate(
      { priority },
      'Không thể cập nhật mức ưu tiên nhiệm vụ.'
    );
  };

  // Tính tiến độ checklist của task đang mở.
  const checklistProgress = useMemo(() => {
    if (!taskDetail || taskDetail.checklist.length === 0) {
      return 0;
    }

    const completed = taskDetail.checklist.filter((item) => item.isCompleted).length;
    return Math.round((completed / taskDetail.checklist.length) * 100);
  }, [taskDetail]);

  // Kiểm tra task đang mở có trễ hạn không.
  const isTaskOverdue = useMemo(() => {
    if (!taskDetail?.dueDate) {
      return false;
    }

    return new Date(taskDetail.dueDate).getTime() < Date.now() && taskDetail.status !== 'done';
  }, [taskDetail]);

  // Lấy tên list hiện tại của task đang mở.
  const taskListName = useMemo(() => {
    if (!taskDetail) {
      return '';
    }

    return lists.find((list) => list.listId === taskDetail.listId)?.name ?? 'Không rõ danh sách nhiệm vụ';
  }, [lists, taskDetail]);

  // Lấy danh sách nhãn hiển thị trên thẻ task.
  const getTaskCardLabels = (taskId: number): TaskLabel[] => {
    const labels = taskDetailById[taskId]?.labels ?? [];
    return labels.slice(0, 3);
  };

  // Lấy mức độ ưu tiên của task.
  const getTaskCardPriority = (taskId: number): 'low' | 'medium' | 'high' => {
    return taskDetailById[taskId]?.priority ?? 'medium';
  };

  // Chuyển đổi mức ưu tiên sang nhãn hiển thị.
  const getTaskPriorityLabel = (priority: 'low' | 'medium' | 'high'): string => {
    if (priority === 'high') {
      return 'Cao';
    }

    if (priority === 'low') {
      return 'Thấp';
    }

    return 'Trung bình';
  };

  // Định dạng hạn chót cho thẻ task.
  const formatTaskCardDueDate = (rawDate: string): string => {
    if (!rawDate) {
      return '';
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }

    return `${parsed.getDate()} thg ${parsed.getMonth() + 1}`;
  };

  // Bắt đầu xem nhanh nhãn của task.
  const startTaskCardLabelPreview = (taskId: number) => {
    setPreviewTaskLabelId(taskId);
  };

  // Kết thúc xem nhanh nhãn của task.
  const endTaskCardLabelPreview = () => {
    setPreviewTaskLabelId(null);
  };

  // Chuyển sang project khác từ hub.
  const handleSwitchProject = (nextProjectId: number) => {
    onSwitchProject(nextProjectId);
    setIsBoardHubOpen(false);
  };

  // Mở trang quản lý tài khoản.
  const handleOpenAccountSettings = () => {
    setIsAccountMenuOpen(false);
    onOpenAccountSettings();
  };

  // Đăng xuất khỏi hệ thống.
  const handleLogout = () => {
    setIsAccountMenuOpen(false);
    onLogout();
  };

  return {
    availableProjects,
    projectName,
    lists,
    activeBoardId,
    isBoardLoading,
    boardError,
    createListError,
    listActionError,
    taskActionError,
    openTaskComposerListId,
    taskDraftByList,
    isAddingList,
    newListName,
    editingListId,
    listNameDraftById,
    isBoardHubOpen,
    boardFilter,
    boardSearchKeyword,
    currentUser,
    isShareModalOpen,
    inviteEmail,
    inviteRole,
    inviteError,
    memberActionError,
    boardMembers,
    notifications,
    isNotificationPanelOpen,
    isAccountMenuOpen,
    draggingTask,
    dragOverListId,
    isTaskDetailOpen,
    taskDetail,
    taskDetailById,
    confirmState,
    isConfirmSubmitting,
    taskCommentDraft,
    taskChecklistDraft,
    taskAttachmentDraft,
    taskLabelDraft,
    taskLabelColorDraft,
    taskAssigneeDraft,
    previewTaskLabelId,
    draggingChecklistItemId,
    dragOverChecklistItemId,
    currentWorkspaceName,
    currentWorkspaceRole,
    currentProjectRole,
    canManageWorkspace,
    canInviteAdmin,
    filteredBoardItems,
    recentBoardItems,
    unreadNotifications,
    checklistProgress,
    isTaskOverdue,
    taskListName,
    setProjectName,
    setLists,
    setActiveBoardId,
    setIsBoardLoading,
    setBoardError,
    setCreateListError,
    setListActionError,
    setTaskActionError,
    setOpenTaskComposerListId,
    setTaskDraftByList,
    setIsAddingList,
    setNewListName,
    setIsBoardHubOpen,
    setBoardFilter,
    setBoardSearchKeyword,
    setIsShareModalOpen,
    setInviteEmail,
    setInviteRole,
    setInviteError,
    setMemberActionError,
    setBoardMembers,
    setNotifications,
    setIsNotificationPanelOpen,
    setIsAccountMenuOpen,
    setDraggingTask,
    setDragOverListId,
    setIsTaskDetailOpen,
    setTaskDetail,
    setTaskDetailById,
    setTaskCommentDraft,
    setTaskChecklistDraft,
    setTaskAttachmentDraft,
    setTaskLabelDraft,
    setTaskLabelColorDraft,
    setTaskAssigneeDraft,
    setPreviewTaskLabelId,
    setDraggingChecklistItemId,
    setDragOverChecklistItemId,
    handleConfirm,
    handleCloseConfirm,
    handleOpenAddList,
    handleSubmitAddList,
    handleStartEditList,
    handleListNameDraftChange,
    handleCancelEditList,
    handleSubmitListName,
    handleDeleteList,
    handleOpenTaskComposer,
    handleTaskDraftChange,
    handleCancelTaskComposer,
    handleSubmitAddTask,
    moveTask,
    handleInviteMember,
    handleUpdateMemberRole,
    handleRemoveMemberFromWorkspace,
    handleOpenNotificationPanel,
    formatLocalDateTime,
    toDateInputValue,
    toServerDateTime,
    updateTaskDetailState,
    handleOpenTaskDetail,
    handleCloseTaskDetail,
    handleDeleteTaskCard,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
    handleMoveChecklistItem,
    handleDropChecklistItem,
    handleAddTaskComment,
    handleDeleteTaskComment,
    handleAddAttachment,
    handleDeleteTaskAttachment,
    handleAddLabel,
    handleRemoveLabel,
    handleAddAssignee,
    handleRemoveAssignee,
    persistTaskUpdate,
    handlePersistTaskTitle,
    handlePersistTaskDescription,
    handlePersistTaskDueDate,
    handlePersistTaskPriority,
    getTaskCardLabels,
    getTaskCardPriority,
    getTaskPriorityLabel,
    formatTaskCardDueDate,
    startTaskCardLabelPreview,
    endTaskCardLabelPreview,
    handleSwitchProject,
    handleOpenAccountSettings,
    handleLogout,
    canManageMemberRole,
    canRemoveMember,
  };
};
