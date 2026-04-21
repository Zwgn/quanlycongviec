import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '../assets/styles/KanbanBoard.css';
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
  updateProjectMemberRole,
} from '../services/dashboard.service';

type KanbanBoardPageProps = {
  projectId: number;
  initialProjectName: string;
  onSwitchProject: (projectId: number) => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
  onOpenAccountSettings: () => void;
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

const mapWorkspaceRoleToLabel = (role: Workspace['role']): BoardMember['role'] => {
  if (role === 'Owner') {
    return 'Chủ sở hữu';
  }

  if (role === 'Admin') {
    return 'Quản trị viên';
  }

  return 'Thành viên';
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

function KanbanBoardPage({
  projectId,
  initialProjectName,
  onSwitchProject,
  onLogout,
  onBackToDashboard,
  onOpenAccountSettings,
}: KanbanBoardPageProps) {
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
  const [taskAssigneeDraft, setTaskAssigneeDraft] = useState('');
  const [previewTaskLabelId, setPreviewTaskLabelId] = useState<number | null>(null);
  const [draggingChecklistItemId, setDraggingChecklistItemId] = useState<number | null>(null);
  const [dragOverChecklistItemId, setDragOverChecklistItemId] = useState<number | null>(null);
  const loadingTaskDetailIdsRef = useRef<Set<number>>(new Set());

  const currentWorkspaceName = useMemo(() => {
    const current = availableProjects.find((item) => item.projectId === projectId);
    return current?.workspaceName || 'Không gian làm việc hiện tại';
  }, [availableProjects, projectId]);

  const currentWorkspaceRole = useMemo<Workspace['role'] | null>(() => {
    const current = availableProjects.find((item) => item.projectId === projectId);
    return current?.workspaceRole ?? null;
  }, [availableProjects, projectId]);

  const currentProjectRole = useMemo<Workspace['role'] | null>(() => {
    const currentMember = boardMembers.find((member) => member.isCurrentUser);
    return currentMember?.workspaceRole ?? currentWorkspaceRole;
  }, [boardMembers, currentWorkspaceRole]);

  const canManageWorkspace =
    currentProjectRole === 'Owner' || currentProjectRole === 'Admin';
  const canInviteAdmin = currentProjectRole === 'Owner';

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

  const canRemoveMember = useCallback(
    (member: BoardMember): boolean => {
      if (!canManageMemberRole(member)) {
        return false;
      }

      return !member.isCurrentUser;
    },
    [canManageMemberRole]
  );

  const refreshWorkspaceMembers = useCallback(async () => {
    if (!currentUser || !projectId || Number.isNaN(projectId)) {
      return;
    }

    const members = await getProjectMembers(projectId);
    setBoardMembers(members.map(mapWorkspaceMember));
  }, [currentUser, mapWorkspaceMember, projectId]);

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

  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  useEffect(() => {
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

  const handleOpenAddList = () => {
    setIsAddingList(true);
    setNewListName('');
  };

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

  const handleDeleteList = async (listId: number, listName: string) => {
    const confirmed = window.confirm(`Bạn có chắc muốn xóa list "${listName}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setListActionError('');
      await deleteList(listId);

      const boardData = await getBoardData(activeBoardId);

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
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Không thể xóa danh sách nhiệm vụ.';
      setListActionError(message);
    }
  };

  const handleOpenTaskComposer = (listId: number) => {
    setOpenTaskComposerListId(listId);
    setTaskDraftByList((prev) => ({
      ...prev,
      [listId]: prev[listId] ?? '',
    }));
  };

  const handleTaskDraftChange = (listId: number, value: string) => {
    setTaskDraftByList((prev) => ({
      ...prev,
      [listId]: value,
    }));
  };

  const handleCancelTaskComposer = (listId: number) => {
    setOpenTaskComposerListId(null);
    setTaskDraftByList((prev) => ({
      ...prev,
      [listId]: '',
    }));
  };

  const handleSubmitAddTask = async (listId: number) => {
    const trimmed = (taskDraftByList[listId] ?? '').trim();

    if (!trimmed) {
      return;
    }

    try {
      await createTask({ title: trimmed, listId });

      const boardData = await getBoardData(activeBoardId);

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

      const boardData = await getBoardData(activeBoardId);

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

      setInviteEmail('');
      setInviteRole('Thành viên');
      setInviteError('');
      setMemberActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể mời thành viên.';
      setInviteError(message);
    }
  };

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

  const handleRemoveMemberFromWorkspace = async (member: BoardMember) => {
    if (!projectId || Number.isNaN(projectId)) {
      setMemberActionError('Không xác định được dự án để xóa thành viên.');
      return;
    }

    if (!canRemoveMember(member)) {
      setMemberActionError('Bạn không có quyền xóa thành viên này.');
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc muốn xóa ${member.fullName} khỏi project?`);
    if (!confirmed) {
      return;
    }

    try {
      await removeProjectMember(projectId, member.id);
      await refreshWorkspaceMembers();
      setMemberActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa thành viên.';
      setMemberActionError(message);
    }
  };

  const handleOpenNotificationPanel = () => {
    setIsNotificationPanelOpen((prev) => !prev);
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const formatLocalDateTime = (date: Date): string => {
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
      date.getHours()
    )}:${pad(date.getMinutes())}`;
  };

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

  const mapTaskDetailFromApi = useCallback((data: TaskDetailResponse): TaskDetailData => {
    const labelName = data.label?.trim();

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
              color: '#2f74ff',
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

  const updateTaskDetailCache = (next: TaskDetailData) => {
    setTaskDetail(next);
    setTaskDetailById((prev) => ({
      ...prev,
      [next.taskId]: next,
    }));
  };

  const refreshTaskDetail = async (taskId: number): Promise<TaskDetailData> => {
    const raw = await getTaskDetail(taskId);
    const mapped = mapTaskDetailFromApi(raw);
    updateTaskDetailCache(mapped);
    return mapped;
  };

  const updateTaskDetailState = (updater: (current: TaskDetailData) => TaskDetailData) => {
    setTaskDetail((current) => {
      if (!current) {
        return current;
      }

      const next = updater(current);

      setTaskDetailById((prev) => ({
        ...prev,
        [next.taskId]: next,
      }));

      return next;
    });
  };

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
    setTaskLabelColorDraft('#2f74ff');
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

  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false);
    setTaskDetail(null);
  };

  const handleDeleteTaskCard = async (taskId: number, listId: number) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa thẻ này không?');
    if (!confirmed) {
      return;
    }

    try {
      await deleteTask(taskId);

      const boardData = await getBoardData(activeBoardId);

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
  };

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

      await refreshTaskDetail(taskDetail.taskId);
      setTaskChecklistDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm mục kiểm tra.';
      setTaskActionError(message);
    }
  };

  const handleToggleChecklistItem = async (itemId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await toggleChecklistItem(itemId);
      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật mục kiểm tra.';
      setTaskActionError(message);
    }
  };

  const handleDeleteChecklistItem = async (itemId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await deleteChecklistItem(itemId);
      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa mục kiểm tra.';
      setTaskActionError(message);
    }
  };

  const handleMoveChecklistItem = async (itemId: number, targetPosition: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await moveChecklistItem(itemId, { position: targetPosition });
      await refreshTaskDetail(taskDetail.taskId);
      setDraggingChecklistItemId(null);
      setDragOverChecklistItemId(null);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể di chuyển mục kiểm tra.';
      setTaskActionError(message);
    }
  };

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

      await refreshTaskDetail(taskDetail.taskId);
      setTaskCommentDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm bình luận.';
      setTaskActionError(message);
    }
  };

  const handleDeleteTaskComment = async (commentId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await deleteComment(commentId);
      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa bình luận.';
      setTaskActionError(message);
    }
  };

  const handleAddAttachment = async () => {
    const fileUrl = taskAttachmentDraft.trim();
    if (!fileUrl || !taskDetail) {
      return;
    }

    const guessedName = fileUrl.split('/').pop() || `attachment-${Date.now()}`;

    try {
      await createAttachment({
        taskId: taskDetail.taskId,
        fileName: guessedName,
        fileUrl,
      });

      await refreshTaskDetail(taskDetail.taskId);
      setTaskAttachmentDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm đính kèm.';
      setTaskActionError(message);
    }
  };

  const handleDeleteTaskAttachment = async (attachmentId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await deleteAttachment(attachmentId);
      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa file đính kèm.';
      setTaskActionError(message);
    }
  };

  const handleAddLabel = async () => {
    const labelName = taskLabelDraft.trim();
    if (!labelName || !taskDetail) {
      return;
    }

    try {
      await updateTask(taskDetail.taskId, {
        label: labelName,
      });

      await refreshTaskDetail(taskDetail.taskId);
      setTaskLabelDraft('');
      setTaskLabelColorDraft('#2f74ff');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm nhãn.';
      setTaskActionError(message);
    }
  };

  const handleRemoveLabel = async (_labelId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await updateTask(taskDetail.taskId, {
        label: null,
      });

      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa nhãn.';
      setTaskActionError(message);
    }
  };

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

      await refreshTaskDetail(taskDetail.taskId);
      setTaskAssigneeDraft('');
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể thêm thành viên vào nhiệm vụ.';
      setTaskActionError(message);
    }
  };

  const handleRemoveAssignee = async (userId: number) => {
    if (!taskDetail) {
      return;
    }

    try {
      await removeTaskAssignee({
        taskId: taskDetail.taskId,
        assigneeUserId: userId,
      });

      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Không thể xóa thành viên khỏi nhiệm vụ.';
      setTaskActionError(message);
    }
  };

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
      await refreshTaskDetail(taskDetail.taskId);
      setTaskActionError('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : fallbackMessage;
      setTaskActionError(message);
    }
  };

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

  const handlePersistTaskDescription = async () => {
    if (!taskDetail) {
      return;
    }

    await persistTaskUpdate(
      { description: taskDetail.description.trim() },
      'Không thể cập nhật mô tả nhiệm vụ.'
    );
  };

  const handlePersistTaskDueDate = async () => {
    if (!taskDetail) {
      return;
    }

    await persistTaskUpdate(
      { dueDate: toServerDateTime(taskDetail.dueDate) },
      'Không thể cập nhật hạn chót nhiệm vụ.'
    );
  };

  const handlePersistTaskPriority = async (priority: 'low' | 'medium' | 'high') => {
    await persistTaskUpdate(
      { priority },
      'Không thể cập nhật mức ưu tiên nhiệm vụ.'
    );
  };

  const checklistProgress = useMemo(() => {
    if (!taskDetail || taskDetail.checklist.length === 0) {
      return 0;
    }

    const completed = taskDetail.checklist.filter((item) => item.isCompleted).length;
    return Math.round((completed / taskDetail.checklist.length) * 100);
  }, [taskDetail]);

  const isTaskOverdue = useMemo(() => {
    if (!taskDetail?.dueDate) {
      return false;
    }

    return new Date(taskDetail.dueDate).getTime() < Date.now() && taskDetail.status !== 'done';
  }, [taskDetail]);

  const taskListName = useMemo(() => {
    if (!taskDetail) {
      return '';
    }

    return lists.find((list) => list.listId === taskDetail.listId)?.name ?? 'Không rõ danh sách nhiệm vụ';
  }, [lists, taskDetail]);

  const getTaskCardLabels = (taskId: number): TaskLabel[] => {
    const labels = taskDetailById[taskId]?.labels ?? [];
    return labels.slice(0, 3);
  };

  const getTaskCardPriority = (taskId: number): 'low' | 'medium' | 'high' => {
    return taskDetailById[taskId]?.priority ?? 'medium';
  };

  const getTaskPriorityLabel = (priority: 'low' | 'medium' | 'high'): string => {
    if (priority === 'high') {
      return 'Cao';
    }

    if (priority === 'low') {
      return 'Thấp';
    }

    return 'Trung bình';
  };

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

  const startTaskCardLabelPreview = (taskId: number) => {
    setPreviewTaskLabelId(taskId);
  };

  const endTaskCardLabelPreview = () => {
    setPreviewTaskLabelId(null);
  };

  return (
    <div className="kanban-root">
      <header className="kanban-topbar">
        <div className="kanban-topbar-left">
          <button type="button" className="kanban-back" onClick={onBackToDashboard}>
            ← Về Dashboard
          </button>
          <div>
            <h1>{projectName}</h1>
            <p>Project #{projectId} • Kanban Board</p>
          </div>
        </div>

        <div className="kanban-topbar-actions">
          {canManageWorkspace ? (
            <button
              type="button"
              className="kanban-share-btn"
              onClick={() => {
                setIsShareModalOpen(true);
                setInviteError('');
                setMemberActionError('');
                setInviteEmail('');
                setInviteRole('Thành viên');
              }}
            >
              + Chia sẻ
            </button>
          ) : null}

          <div className="kanban-notification-wrap">
            <button
              type="button"
              className="kanban-bell-btn"
              aria-label="Thông báo"
              onClick={handleOpenNotificationPanel}
            >
              <svg
                className="kanban-bell-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M12 3C8.96243 3 6.5 5.46243 6.5 8.5V11.2C6.5 12.2144 6.17449 13.2021 5.57143 14L4.6 15.2857C4.10458 15.9412 4.57221 16.875 5.3956 16.875H18.6044C19.4278 16.875 19.8954 15.9412 19.4 15.2857L18.4286 14C17.8255 13.2021 17.5 12.2144 17.5 11.2V8.5C17.5 5.46243 15.0376 3 12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.75 19C10.15 19.6 10.98 20 12 20C13.02 20 13.85 19.6 14.25 19"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {unreadNotifications > 0 ? <span className="kanban-bell-badge">{unreadNotifications}</span> : null}
            </button>

            {isNotificationPanelOpen ? (
              <div className="kanban-notification-panel" role="dialog" aria-label="Danh sách thông báo">
                <h4>Thông báo</h4>

                {notifications.length === 0 ? (
                  <p className="kanban-notification-empty">Chưa có thông báo mới.</p>
                ) : (
                  <div className="kanban-notification-list">
                    {notifications.map((item) => (
                      <article key={item.id} className="kanban-notification-item">
                        <strong>{item.message}</strong>
                        <span>{item.timeLabel}</span>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="kanban-account-wrap">
            <button
              type="button"
              className="kanban-user-name-chip"
              title={currentUser?.email ?? 'user@taskflow.app'}
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
            >
              {currentUser?.fullName ?? 'Thành viên TaskFlow'}
            </button>

            {isAccountMenuOpen ? (
              <div className="kanban-account-menu" role="menu" aria-label="Menu tài khoản">
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

          {canManageWorkspace ? (
            <button type="button" className="kanban-primary-btn" onClick={handleOpenAddList}>
              + Thêm danh sách nhiệm vụ
            </button>
          ) : null}
        </div>
      </header>

      <main className="kanban-board-scroll" aria-label="Bảng Kanban">
        {isBoardLoading ? <p className="kanban-empty">Đang tải dữ liệu bảng...</p> : null}

        {lists.map((list) => (
          <section key={list.listId} className="kanban-list">
            <div className="kanban-list-head">
              <h2>{list.name}</h2>
              <div className="kanban-list-head-actions">
                <span>{list.tasks.length} thẻ</span>
                {canManageWorkspace ? (
                  <button
                    type="button"
                    className="kanban-list-remove"
                    onClick={() => {
                      void handleDeleteList(list.listId, list.name);
                    }}
                  >
                    Xóa
                  </button>
                ) : null}
              </div>
            </div>

            <div className="kanban-task-stack">
              {list.tasks.map((task) => {
                const taskCardLabels = getTaskCardLabels(task.taskId);
                const showTaskCardLabelTitles = previewTaskLabelId === task.taskId;
                const taskPriority = getTaskCardPriority(task.taskId);
                const taskCardDetail = taskDetailById[task.taskId];
                const hasDescription = Boolean(taskCardDetail?.description?.trim());
                const commentCount = taskCardDetail?.comments.length ?? 0;
                const checklistTotal = taskCardDetail?.checklist.length ?? 0;
                const checklistDone = taskCardDetail?.checklist.filter((item) => item.isCompleted).length ?? 0;
                const dueDateLabel = formatTaskCardDueDate(taskCardDetail?.dueDate ?? '');
                const hasDueDate = dueDateLabel.length > 0;
                const isTaskCardOverdue =
                  hasDueDate
                  && (taskCardDetail?.status ?? 'todo') !== 'done'
                  && new Date(taskCardDetail?.dueDate ?? '').getTime() < Date.now();

                return (
                  <article
                    key={task.taskId}
                    className={`kanban-task-card${draggingTask?.taskId === task.taskId ? ' is-dragging' : ''}`}
                    draggable
                    onClick={() => handleOpenTaskDetail(list.listId, task)}
                    onDragStart={() => {
                      setDraggingTask({ taskId: task.taskId, sourceListId: list.listId });
                      setDragOverListId(list.listId);
                    }}
                    onDragEnd={() => {
                      setDraggingTask(null);
                      setDragOverListId(null);
                    }}
                    onDragOver={(event) => {
                      if (!draggingTask) {
                        return;
                      }
                      event.preventDefault();
                      setDragOverListId(list.listId);
                    }}
                    onDrop={(event) => {
                      if (!draggingTask) {
                        return;
                      }
                      event.preventDefault();
                      void moveTask(list.listId, task.taskId);
                      setDraggingTask(null);
                      setDragOverListId(null);
                    }}
                  >
                    <div className="kanban-task-card-head">
                      {taskCardLabels.length > 0 ? (
                        <button
                          type="button"
                          className={`kanban-task-card-label-bars${showTaskCardLabelTitles ? ' is-expanded' : ''}`}
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                          onMouseDown={(event) => {
                            event.stopPropagation();
                            startTaskCardLabelPreview(task.taskId);
                          }}
                          onMouseUp={(event) => {
                            event.stopPropagation();
                            endTaskCardLabelPreview();
                          }}
                          onMouseLeave={endTaskCardLabelPreview}
                          onTouchStart={(event) => {
                            event.stopPropagation();
                            startTaskCardLabelPreview(task.taskId);
                          }}
                          onTouchEnd={(event) => {
                            event.stopPropagation();
                            endTaskCardLabelPreview();
                          }}
                          onBlur={endTaskCardLabelPreview}
                          title="Nhấn giữ để xem tiêu đề nhãn"
                          aria-label="Nhấn giữ để xem tiêu đề nhãn"
                        >
                          {taskCardLabels.map((label) => (
                            <span key={label.id} style={{ backgroundColor: label.color }}>
                              {showTaskCardLabelTitles ? label.name : null}
                            </span>
                          ))}
                        </button>
                      ) : (
                        <span />
                      )}

                      <div className="kanban-task-card-icon-actions">
                        <button
                          type="button"
                          aria-label="Xóa nhiệm vụ"
                          title="Xóa nhiệm vụ"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTaskCard(task.taskId, list.listId);
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
                        <button
                          type="button"
                          aria-label="Chỉnh sửa nhiệm vụ"
                          title="Chỉnh sửa nhiệm vụ"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenTaskDetail(list.listId, task);
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
                      </div>
                    </div>

                    <span className={`kanban-task-priority-badge is-${taskPriority}`}>
                      {getTaskPriorityLabel(taskPriority)}
                    </span>

                    <h3>{task.title}</h3>

                    <div className="kanban-task-card-meta">
                      {hasDueDate ? (
                        <span
                          className={`kanban-task-card-meta-item kanban-task-card-meta-due${
                            isTaskCardOverdue ? ' is-overdue' : ' is-ontrack'
                          }`}
                          title={isTaskCardOverdue ? 'Nhiệm vụ quá hạn' : 'Nhiệm vụ còn hạn'}
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M12 7.2v5.1l3.1 1.8M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{dueDateLabel}</span>
                        </span>
                      ) : null}

                      {hasDescription ? (
                        <span className="kanban-task-card-meta-item" title="Nhiệm vụ có mô tả">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M4.5 7.5h15M4.5 12h11M4.5 16.5h8"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </span>
                      ) : null}

                      {commentCount > 0 ? (
                        <span className="kanban-task-card-meta-item" title="Bình luận">
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M5.8 6.5h12.4c1 0 1.8.8 1.8 1.8v7.4c0 1-.8 1.8-1.8 1.8H11l-4 2.6v-2.6H5.8c-1 0-1.8-.8-1.8-1.8V8.3c0-1 .8-1.8 1.8-1.8Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{commentCount}</span>
                        </span>
                      ) : null}

                      {checklistTotal > 0 ? (
                        <span
                          className={`kanban-task-card-meta-item kanban-task-card-meta-checklist${
                            checklistDone === checklistTotal ? ' is-complete' : ''
                          }`}
                          title="Tiến độ mục kiểm tra"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              d="M6.3 6.3h11.4v11.4H6.3zM9.2 12l2 2 3.7-4"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{checklistDone}/{checklistTotal}</span>
                        </span>
                      ) : null}
                    </div>
                  </article>
                );
              })}

              {list.tasks.length === 0 ? <p className="kanban-empty">Chưa có nhiệm vụ trong danh sách này.</p> : null}
            </div>

            <div
              className={`kanban-list-dropzone${dragOverListId === list.listId ? ' is-active' : ''}`}
              onDragOver={(event) => {
                if (!draggingTask) {
                  return;
                }
                event.preventDefault();
                setDragOverListId(list.listId);
              }}
              onDrop={(event) => {
                if (!draggingTask) {
                  return;
                }
                event.preventDefault();
                void moveTask(list.listId);
                setDraggingTask(null);
                setDragOverListId(null);
              }}
            />

            {openTaskComposerListId === list.listId ? (
              <div className="kanban-add-task-inline">
                <textarea
                  className="kanban-task-input"
                  rows={3}
                  value={taskDraftByList[list.listId] ?? ''}
                  onChange={(event) => handleTaskDraftChange(list.listId, event.target.value)}
                  placeholder="Nhập tiêu đề hoặc dán liên kết"
                  autoFocus
                />
                <div className="kanban-inline-actions">
                  <button type="button" className="kanban-inline-submit" onClick={() => handleSubmitAddTask(list.listId)}>
                    Thêm thẻ
                  </button>
                  <button type="button" className="kanban-inline-cancel" onClick={() => handleCancelTaskComposer(list.listId)}>
                    Hủy
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="kanban-add-task" onClick={() => handleOpenTaskComposer(list.listId)}>
                + Thêm thẻ
              </button>
            )}
          </section>
        ))}

        {canManageWorkspace
          ? isAddingList
            ? (
              <section className="kanban-add-list-inline" aria-label="Thêm danh sách mới">
                <input
                  className="kanban-list-input"
                  value={newListName}
                  onChange={(event) => setNewListName(event.target.value)}
                  placeholder="Nhập tiêu đề danh sách"
                  maxLength={255}
                  autoFocus
                />
                <div className="kanban-inline-actions">
                  <button type="button" className="kanban-inline-submit" onClick={handleSubmitAddList}>
                    Thêm danh sách
                  </button>
                  <button
                    type="button"
                    className="kanban-inline-cancel"
                    onClick={() => {
                      setIsAddingList(false);
                      setNewListName('');
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </section>
            )
            : (
              <button type="button" className="kanban-add-list-tail" onClick={handleOpenAddList}>
                + Thêm danh sách khác
              </button>
            )
          : null}
      </main>

      <div className="kanban-bottom-dock" role="navigation" aria-label="Thanh điều hướng Kanban">
        <button type="button" className="kanban-dock-link is-active" aria-label="Bảng hiện tại">
          Bảng hiện tại: {projectName}
        </button>
        <button
          type="button"
          className="kanban-dock-link"
          aria-label="Chuyển đổi các bảng"
          onClick={() => setIsBoardHubOpen(true)}
        >
          Chuyển đổi các bảng
        </button>
      </div>

      {isBoardHubOpen ? (
        <div
          className="kanban-boardhub-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsBoardHubOpen(false);
            }
          }}
        >
          <div className="kanban-boardhub-modal" role="dialog" aria-modal="true" aria-label="Chuyển đổi bảng">
            <div className="kanban-boardhub-search-row">
              <input
                className="kanban-boardhub-search"
                value={boardSearchKeyword}
                onChange={(event) => setBoardSearchKeyword(event.target.value)}
                placeholder="Tìm bảng của bạn"
                autoFocus
              />
            </div>

            <div className="kanban-boardhub-tabs">
              <button
                type="button"
                className={`kanban-boardhub-tab${boardFilter === 'all' ? ' is-active' : ''}`}
                onClick={() => setBoardFilter('all')}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={`kanban-boardhub-tab${boardFilter === 'workspace' ? ' is-active' : ''}`}
                onClick={() => setBoardFilter('workspace')}
              >
                {currentWorkspaceName}
              </button>
            </div>

            <section className="kanban-boardhub-section">
              <h3>Gần đây</h3>
              <div className="kanban-boardhub-grid">
                {recentBoardItems.map((item) => (
                  <button
                    key={`recent-${item.projectId}`}
                    type="button"
                    className={`kanban-boardhub-card${item.projectId === projectId ? ' is-active' : ''}`}
                    onClick={() => {
                      onSwitchProject(item.projectId);
                      setIsBoardHubOpen(false);
                    }}
                  >
                    <span className={`kanban-boardhub-cover cover-${item.projectId % 3}`} />
                    <strong>{item.projectName}</strong>
                  </button>
                ))}
              </div>
            </section>

            <section className="kanban-boardhub-section">
              <h3>{currentWorkspaceName}</h3>
              <div className="kanban-boardhub-grid">
                {filteredBoardItems.map((item) => (
                  <button
                    key={`workspace-${item.projectId}`}
                    type="button"
                    className={`kanban-boardhub-card${item.projectId === projectId ? ' is-active' : ''}`}
                    onClick={() => {
                      onSwitchProject(item.projectId);
                      setIsBoardHubOpen(false);
                    }}
                  >
                    <span className={`kanban-boardhub-cover cover-${item.projectId % 3}`} />
                    <strong>{item.projectName}</strong>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {isTaskDetailOpen && taskDetail ? (
        <div
          className="kanban-boardhub-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseTaskDetail();
            }
          }}
        >
          <div className="kanban-task-detail-modal" role="dialog" aria-modal="true" aria-label="Chi tiết nhiệm vụ">
            <div className="kanban-task-detail-topbar">
              <div className="kanban-task-detail-topbar-left">
                <span className="kanban-task-detail-list-badge is-topbar">{taskListName}</span>
              </div>
              <button
                type="button"
                className="kanban-task-detail-close"
                aria-label="Đóng chi tiết nhiệm vụ"
                onClick={handleCloseTaskDetail}
              >
                ×
              </button>
            </div>

            <div className="kanban-task-detail-main">
              <header className="kanban-task-detail-header">
                <div className="kanban-task-detail-title-wrap">
                  <span className="kanban-task-title-mark" aria-hidden="true" />
                  <input
                    className="kanban-task-detail-title"
                    value={taskDetail.title}
                    onChange={(event) => {
                      const value = event.target.value;
                      updateTaskDetailState((current) => ({ ...current, title: value }));
                    }}
                    onBlur={() => {
                      void handlePersistTaskTitle();
                    }}
                  />
                </div>
              </header>

              <div className="kanban-task-detail-quick-actions">
                <button
                  type="button"
                  onClick={() => {
                    const checklistInput = document.querySelector<HTMLInputElement>(
                      '.kanban-task-inline-form input[placeholder="Thêm một mục"]'
                    );
                    checklistInput?.focus();
                  }}
                >
                  + Thêm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextDueDate = formatLocalDateTime(new Date(Date.now() + 24 * 60 * 60 * 1000));
                    updateTaskDetailState((current) => ({
                      ...current,
                      dueDate: nextDueDate,
                    }));
                    void persistTaskUpdate(
                      { dueDate: toServerDateTime(nextDueDate) },
                      'Không thể cập nhật hạn chót nhiệm vụ.'
                    );
                  }}
                >
                  Ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const checklistInput = document.querySelector<HTMLInputElement>(
                      '.kanban-task-inline-form input[placeholder="Thêm một mục"]'
                    );
                    checklistInput?.focus();
                  }}
                >
                  Việc cần làm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const attachmentInput = document.querySelector<HTMLInputElement>(
                      '.kanban-task-inline-form input[placeholder="Dán link file"]'
                    );
                    attachmentInput?.focus();
                  }}
                >
                  Đính kèm
                </button>
              </div>

              <div className="kanban-task-detail-meta-grid">
                <section className="kanban-task-detail-block">
                  <h4>Thành viên</h4>
                  <div className="kanban-task-detail-assignees">
                    {taskDetail.assignees.map((assignee) => (
                      <span key={assignee.userId} className="kanban-task-assignee-chip">
                        {assignee.fullName}
                        <button type="button" onClick={() => handleRemoveAssignee(assignee.userId)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="kanban-task-inline-form">
                    <select
                      value={taskAssigneeDraft}
                      onChange={(event) => setTaskAssigneeDraft(event.target.value)}
                    >
                      <option value="">Chọn thành viên</option>
                      {boardMembers.map((member) => (
                        <option key={member.id} value={String(member.id)}>
                          {member.fullName}
                        </option>
                      ))}
                    </select>
                    <button type="button" onClick={handleAddAssignee}>Thêm</button>
                  </div>
                </section>

                <section className="kanban-task-detail-block">
                  <h4>Ưu tiên</h4>
                  <div className="kanban-task-inline-form">
                    <select
                      value={taskDetail.priority}
                      onChange={(event) => {
                        const nextPriority = event.target.value as 'low' | 'medium' | 'high';

                        updateTaskDetailState((current) => ({
                          ...current,
                          priority: nextPriority,
                        }));

                        void handlePersistTaskPriority(nextPriority);
                      }}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                </section>

                <section className="kanban-task-detail-block">
                  <h4>Ngày hết hạn</h4>
                  <div className="kanban-task-due-row">
                    <input
                      type="datetime-local"
                      value={toDateInputValue(taskDetail.dueDate)}
                      onChange={(event) => {
                        updateTaskDetailState((current) => ({
                          ...current,
                          dueDate: event.target.value,
                        }));
                      }}
                      onBlur={() => {
                        void handlePersistTaskDueDate();
                      }}
                    />
                    <span className={`kanban-task-due-status${isTaskOverdue ? ' is-overdue' : ' is-ontrack'}`}>
                      {isTaskOverdue ? 'Quá hạn' : 'Đúng hạn'}
                    </span>
                  </div>
                </section>
              </div>

              <section className="kanban-task-detail-section">
                <div className="kanban-task-section-head kanban-task-section-head--description">
                  <h4>
                    <span className="kanban-task-head-icon" aria-hidden="true" />
                    Mô tả
                  </h4>
                </div>
                <textarea
                  className="kanban-task-detail-description"
                  value={taskDetail.description}
                  onChange={(event) => {
                    const value = event.target.value;
                    updateTaskDetailState((current) => ({ ...current, description: value }));
                  }}
                  onBlur={() => {
                    void handlePersistTaskDescription();
                  }}
                />
              </section>

              <section className="kanban-task-detail-section">
                <div className="kanban-task-section-head">
                  <h4>Nhãn</h4>
                </div>
                <div className="kanban-task-labels">
                  {taskDetail.labels.map((label) => (
                    <span key={label.id} className="kanban-task-label-chip">
                      <span className="kanban-task-label-chip-color" style={{ backgroundColor: label.color }} />
                      {label.name}
                      <button type="button" onClick={() => handleRemoveLabel(label.id)}>×</button>
                    </span>
                  ))}
                </div>
                <div className="kanban-task-inline-form kanban-task-inline-form--label">
                  <input
                    type="color"
                    className="kanban-task-label-color-input"
                    value={taskLabelColorDraft}
                    onChange={(event) => setTaskLabelColorDraft(event.target.value)}
                    aria-label="Màu nhãn"
                  />
                  <input
                    value={taskLabelDraft}
                    onChange={(event) => setTaskLabelDraft(event.target.value)}
                    placeholder="Tên nhãn"
                  />
                  <button type="button" onClick={handleAddLabel}>Thêm</button>
                </div>
              </section>

              <section className="kanban-task-detail-section">
                <div className="kanban-task-section-head">
                  <h4>Đính kèm</h4>
                </div>
                <div className="kanban-task-attachments">
                  {taskDetail.attachments.map((attachment) => (
                    <article key={attachment.attachmentId} className="kanban-task-attachment-item">
                      <button
                        type="button"
                        className="kanban-task-item-delete"
                        aria-label="Xóa đính kèm"
                        onClick={() => {
                          void handleDeleteTaskAttachment(attachment.attachmentId);
                        }}
                      >
                        x
                      </button>
                      <strong>{attachment.fileName}</strong>
                      <a href={attachment.fileUrl} target="_blank" rel="noreferrer">
                        Mở liên kết
                      </a>
                    </article>
                  ))}
                </div>
                <div className="kanban-task-inline-form">
                  <input
                    value={taskAttachmentDraft}
                    onChange={(event) => setTaskAttachmentDraft(event.target.value)}
                    placeholder="Dán link file"
                  />
                  <button type="button" onClick={handleAddAttachment}>Thêm</button>
                </div>
              </section>

              <section className="kanban-task-detail-section">
                <div className="kanban-task-section-head">
                  <h4>Việc cần làm</h4>
                  <span>{checklistProgress}%</span>
                </div>
                <div className="kanban-task-progress">
                  <span style={{ width: `${checklistProgress}%` }} />
                </div>
                <div className="kanban-task-checklist">
                  {taskDetail.checklist.map((item) => (
                    <label
                      key={item.id}
                      className={`kanban-task-check-item${
                        draggingChecklistItemId === item.id ? ' is-dragging' : ''
                      }${dragOverChecklistItemId === item.id ? ' is-drag-over' : ''}`}
                      draggable
                      onDragStart={(event) => {
                        setDraggingChecklistItemId(item.id);
                        setDragOverChecklistItemId(item.id);
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', String(item.id));
                      }}
                      onDragOver={(event) => {
                        if (!draggingChecklistItemId) {
                          return;
                        }

                        event.preventDefault();
                        setDragOverChecklistItemId(item.id);
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        void handleDropChecklistItem(item.id);
                      }}
                      onDragEnd={() => {
                        setDraggingChecklistItemId(null);
                        setDragOverChecklistItemId(null);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => handleToggleChecklistItem(item.id)}
                      />
                      <span className={item.isCompleted ? 'is-completed' : ''}>{item.content}</span>
                      <div className="kanban-task-check-item-actions">
                        <button type="button" onClick={() => handleDeleteChecklistItem(item.id)}>
                          Xóa
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="kanban-task-inline-form">
                  <input
                    value={taskChecklistDraft}
                    onChange={(event) => setTaskChecklistDraft(event.target.value)}
                    placeholder="Thêm một mục"
                  />
                  <button type="button" onClick={handleAddChecklistItem}>Thêm</button>
                </div>
              </section>
            </div>

            <aside className="kanban-task-detail-sidebar">
              <div className="kanban-task-sidebar-head">
                <h4>Nhận xét và hoạt động</h4>
              </div>

              <div className="kanban-task-sidebar-section">
                <input
                  className="kanban-boardhub-search"
                  value={taskCommentDraft}
                  onChange={(event) => setTaskCommentDraft(event.target.value)}
                  placeholder="Viết bình luận..."
                />
                <button type="button" className="kanban-share-submit" onClick={handleAddTaskComment}>
                  Gửi bình luận
                </button>
                <div className="kanban-task-comments">
                  {taskDetail.comments.map((comment) => (
                    <article key={comment.commentId} className="kanban-task-comment-item">
                      <button
                        type="button"
                        className="kanban-task-item-delete"
                        aria-label="Xóa bình luận"
                        onClick={() => {
                          void handleDeleteTaskComment(comment.commentId);
                        }}
                      >
                        x
                      </button>
                      <strong>{comment.fullName}</strong>
                      <p>{comment.content}</p>
                      <span>{new Date(comment.createdAt).toLocaleString('vi-VN')}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="kanban-task-sidebar-section">
                <h5>Hoạt động</h5>
                <div className="kanban-task-activity-list">
                  {taskDetail.activity.map((item) => (
                    <article key={item.activityId} className="kanban-task-activity-item">
                      <strong>{item.fullName}</strong>
                      <p>{item.action}</p>
                      <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                    </article>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      ) : null}

      {isShareModalOpen ? (
        <div
          className="kanban-boardhub-overlay"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsShareModalOpen(false);
            }
          }}
        >
          <div className="kanban-share-modal" role="dialog" aria-modal="true" aria-label="Mời thành viên">
            <div className="kanban-share-head">
              <h3>Chia sẻ bảng</h3>
              <button type="button" className="kanban-share-close" onClick={() => setIsShareModalOpen(false)}>
                x
              </button>
            </div>

            <form className="kanban-share-form" onSubmit={handleInviteMember}>
              <div className="kanban-share-invite-row">
                <input
                  className="kanban-boardhub-search"
                  value={inviteEmail}
                  onChange={(event) => {
                    setInviteEmail(event.target.value);
                    if (inviteError) {
                      setInviteError('');
                    }
                  }}
                  placeholder="Địa chỉ email hoặc tên"
                  autoFocus
                />
                <select
                  className="kanban-share-role"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as 'Thành viên' | 'Quản trị viên')}
                >
                  <option value="Thành viên">Thành viên</option>
                  {canInviteAdmin ? <option value="Quản trị viên">Quản trị viên</option> : null}
                </select>
                <button type="submit" className="kanban-share-submit">
                  Chia sẻ
                </button>
              </div>
            </form>

            <div className="kanban-share-link-box">
              <div className="kanban-share-link-icon">#</div>
              <div className="kanban-share-link-copy">
                <strong>Chia sẻ bảng này bằng liên kết</strong>
                <button type="button" className="kanban-share-link-action">
                  Tạo liên kết
                </button>
              </div>
            </div>

            <div className="kanban-share-tabs">
              <button type="button" className="kanban-share-tab is-active">
                Thành viên của bảng thông tin <span>{boardMembers.length}</span>
              </button>
            </div>

            <div className="kanban-share-members">
              {boardMembers.map((member) => (
                <div key={member.id} className="kanban-share-member-item">
                  <div className="kanban-share-member-meta">
                    <strong>{member.fullName}{member.isCurrentUser ? ' (bạn)' : ''}</strong>
                    <p>{member.email} • {member.role}</p>
                  </div>
                  <div className="kanban-share-member-actions">
                    {canManageMemberRole(member) ? (
                      <select
                        className="kanban-share-member-role"
                        value={member.workspaceRole}
                        onChange={(event) => {
                          const nextRole = event.target.value as Workspace['role'];
                          void handleUpdateMemberRole(member, nextRole);
                        }}
                      >
                        <option value="Member">Thành viên</option>
                        {currentProjectRole === 'Owner' ? <option value="Admin">Quản trị viên</option> : null}
                      </select>
                    ) : (
                      <button type="button" className="kanban-share-member-role" disabled>
                        {member.role}
                      </button>
                    )}

                    {canRemoveMember(member) ? (
                      <button
                        type="button"
                        className="kanban-share-member-remove"
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

    </div>
  );
}

export default KanbanBoardPage;

