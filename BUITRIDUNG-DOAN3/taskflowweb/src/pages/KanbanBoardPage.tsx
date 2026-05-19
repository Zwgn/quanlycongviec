import '../assets/styles/KanbanBoard.css';
import ConfirmModal from '../components/common/ConfirmModal';
import { useKanbanBoardPage } from '../hooks/useKanbanBoardPage';
import type { Workspace } from '../services/dashboard.service';

type KanbanBoardPageProps = {
  projectId: number;
  initialProjectName: string;
  onSwitchProject: (projectId: number) => void;
  onLogout: () => void;
  onBackToDashboard: () => void;
  onOpenAccountSettings: () => void;
};

// Trang bảng Kanban hiển thị và thao tác công việc.
function KanbanBoardPage({
  projectId,
  initialProjectName,
  onSwitchProject,
  onLogout,
  onBackToDashboard,
  onOpenAccountSettings,
}: KanbanBoardPageProps) {
  const {
    projectName,
    lists,
    isBoardLoading,
    currentUser,
    currentWorkspaceName,
    currentProjectRole,
    canManageWorkspace,
    canInviteAdmin,
    isShareModalOpen,
    setIsShareModalOpen,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteError,
    setInviteError,
    memberActionError,
    setMemberActionError,
    boardMembers,
    notifications,
    unreadNotifications,
    isNotificationPanelOpen,
    handleOpenNotificationPanel,
    isAccountMenuOpen,
    setIsAccountMenuOpen,
    handleOpenAddList,
    handleDeleteList,
    handleOpenTaskDetail,
    draggingTask,
    setDraggingTask,
    dragOverListId,
    setDragOverListId,
    confirmState,
    isConfirmSubmitting,
    handleConfirm,
    handleCloseConfirm,
    moveTask,
    getTaskCardLabels,
    previewTaskLabelId,
    startTaskCardLabelPreview,
    endTaskCardLabelPreview,
    getTaskCardPriority,
    getTaskPriorityLabel,
    taskDetailById,
    formatTaskCardDueDate,
    openTaskComposerListId,
    taskDraftByList,
    handleTaskDraftChange,
    handleSubmitAddTask,
    handleCancelTaskComposer,
    handleOpenTaskComposer,
    isAddingList,
    newListName,
    editingListId,
    listNameDraftById,
    setNewListName,
    setIsAddingList,
    handleSubmitAddList,
    handleStartEditList,
    handleListNameDraftChange,
    handleCancelEditList,
    handleSubmitListName,
    isBoardHubOpen,
    setIsBoardHubOpen,
    boardSearchKeyword,
    setBoardSearchKeyword,
    boardFilter,
    setBoardFilter,
    recentBoardItems,
    filteredBoardItems,
    isTaskDetailOpen,
    taskDetail,
    handleCloseTaskDetail,
    taskListName,
    updateTaskDetailState,
    handlePersistTaskTitle,
    formatLocalDateTime,
    persistTaskUpdate,
    toServerDateTime,
    toDateInputValue,
    handlePersistTaskDueDate,
    handlePersistTaskDescription,
    handlePersistTaskPriority,
    taskAssigneeDraft,
    setTaskAssigneeDraft,
    handleAddAssignee,
    handleRemoveAssignee,
    isTaskOverdue,
    taskLabelColorDraft,
    setTaskLabelColorDraft,
    taskLabelDraft,
    setTaskLabelDraft,
    handleAddLabel,
    handleRemoveLabel,
    taskAttachmentDraft,
    setTaskAttachmentDraft,
    handleAddAttachment,
    handleDeleteTaskAttachment,
    checklistProgress,
    taskChecklistDraft,
    setTaskChecklistDraft,
    handleAddChecklistItem,
    handleToggleChecklistItem,
    handleDeleteChecklistItem,
    draggingChecklistItemId,
    setDraggingChecklistItemId,
    dragOverChecklistItemId,
    setDragOverChecklistItemId,
    handleDropChecklistItem,
    taskCommentDraft,
    setTaskCommentDraft,
    handleAddTaskComment,
    handleDeleteTaskComment,
    handleDeleteTaskCard,
    handleInviteMember,
    canManageMemberRole,
    handleUpdateMemberRole,
    canRemoveMember,
    handleRemoveMemberFromWorkspace,
    handleSwitchProject,
    handleOpenAccountSettings,
    handleLogout,
  } = useKanbanBoardPage({
    projectId,
    initialProjectName,
    onSwitchProject,
    onOpenAccountSettings,
    onLogout,
  });

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

        {lists.map((list) => {
          const isEditingList = editingListId === list.listId;
          const listDraftValue = listNameDraftById[list.listId] ?? list.name;

          return (
            <section key={list.listId} className="kanban-list">
              <div className="kanban-list-head">
                <h2 className="kanban-list-title">
                  {isEditingList ? (
                    <input
                      className="kanban-list-title-input"
                      value={listDraftValue}
                      onChange={(event) => handleListNameDraftChange(list.listId, event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void handleSubmitListName(list.listId);
                        }

                        if (event.key === 'Escape') {
                          event.preventDefault();
                          handleCancelEditList(list.listId);
                        }
                      }}
                      maxLength={255}
                      autoFocus
                      aria-label="Chỉnh sửa tiêu đề danh sách"
                    />
                  ) : (
                    <button
                      type="button"
                      className="kanban-list-title-button"
                      onClick={() => handleStartEditList(list.listId, list.name)}
                      disabled={!canManageWorkspace}
                      title={canManageWorkspace ? 'Sửa tên danh sách' : undefined}
                    >
                      {list.name}
                    </button>
                  )}
                </h2>
                <div className="kanban-list-head-actions">
                  <span>{list.tasks.length} thẻ</span>
                  {canManageWorkspace ? (
                    isEditingList ? (
                      <>
                        <button
                          type="button"
                          className="kanban-list-save"
                          onClick={() => {
                            void handleSubmitListName(list.listId);
                          }}
                        >
                          Lưu
                        </button>
                        <button
                          type="button"
                          className="kanban-list-cancel"
                          onClick={() => handleCancelEditList(list.listId)}
                        >
                          Hủy
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="kanban-list-remove"
                        onClick={() => {
                          void handleDeleteList(list.listId, list.name);
                        }}
                      >
                        Xóa
                      </button>
                    )
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

              {list.tasks.length === 0 ? <p className="kanban-empty">Chua có nhiệm vụ trong danh sách này.</p> : null}
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
          );
        })}

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
                <strong>Chia sẻ bảng này bảng liên kết</strong>
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

export default KanbanBoardPage;








