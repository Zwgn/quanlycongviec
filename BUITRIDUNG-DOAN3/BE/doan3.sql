CREATE DATABASE DOAN3
USE DOAN3

--Bảng User
CREATE TABLE [User] (
    userId INT IDENTITY(1,1) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    fullName NVARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE()
)
--Bảng Workspace
CREATE TABLE Workspace (
    workspaceId INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    ownerId INT NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Workspace_User 
    FOREIGN KEY (ownerId) REFERENCES [User](userId)
)
--Bảng WorkspaceMember
CREATE TABLE WorkspaceMember (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    workspaceId INT NOT NULL,
    role NVARCHAR(50) NOT NULL,
    joinedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_WM_User FOREIGN KEY (userId) REFERENCES [User](userId),
    CONSTRAINT FK_WM_Workspace FOREIGN KEY (workspaceId) REFERENCES Workspace(workspaceId),

    CONSTRAINT UQ_Workspace_User UNIQUE (userId, workspaceId)
)
--Bảng Project
CREATE TABLE Project (
    projectId INT IDENTITY(1,1) PRIMARY KEY,
    workspaceId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    createdAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Project_Workspace 
    FOREIGN KEY (workspaceId) REFERENCES Workspace(workspaceId)
)
--Bảng ProjectMember
CREATE TABLE ProjectMember (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    projectId INT NOT NULL,
    role NVARCHAR(50),
    joinedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_PM_User FOREIGN KEY (userId) REFERENCES [User](userId),
    CONSTRAINT FK_PM_Project FOREIGN KEY (projectId) REFERENCES Project(projectId),

    CONSTRAINT UQ_Project_User UNIQUE (userId, projectId)
)
--Bảng Board
CREATE TABLE Board (
    boardId INT IDENTITY(1,1) PRIMARY KEY,
    projectId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Board_Project 
    FOREIGN KEY (projectId) REFERENCES Project(projectId)
)
--Bảng List
CREATE TABLE [List] (
    listId INT IDENTITY(1,1) PRIMARY KEY,
    boardId INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    position INT NOT NULL,

    CONSTRAINT FK_List_Board 
    FOREIGN KEY (boardId) REFERENCES Board(boardId)
)
--Bảng Task
CREATE TABLE Task (
    taskId INT IDENTITY(1,1) PRIMARY KEY,
    listId INT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    label NVARCHAR(100),
    description NVARCHAR(MAX),
    dueDate DATETIME,
    priority NVARCHAR(50),
    status NVARCHAR(50),
    position INT,
    createdAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Task_List 
    FOREIGN KEY (listId) REFERENCES [List](listId)
)

IF COL_LENGTH('Task', 'label') IS NULL
BEGIN
    ALTER TABLE Task ADD label NVARCHAR(100) NULL;
END
--Bảng ChecklistItem
CREATE TABLE ChecklistItem (
    id INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    isCompleted BIT NOT NULL DEFAULT 0,
    position INT NOT NULL,

    CONSTRAINT FK_ChecklistItem_Task
    FOREIGN KEY (taskId) REFERENCES Task(taskId)
)
--Bảng TaskAssignee
CREATE TABLE TaskAssignee (
    id INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    userId INT NOT NULL,
    assignedAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_TA_Task FOREIGN KEY (taskId) REFERENCES Task(taskId),
    CONSTRAINT FK_TA_User FOREIGN KEY (userId) REFERENCES [User](userId),

    CONSTRAINT UQ_Task_User UNIQUE (taskId, userId)
)
--Bảng Comment
CREATE TABLE Comment (
    commentId INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    userId INT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Comment_Task FOREIGN KEY (taskId) REFERENCES Task(taskId),
    CONSTRAINT FK_Comment_User FOREIGN KEY (userId) REFERENCES [User](userId)
)
--Bảng Attachment
CREATE TABLE Attachment (
    attachmentId INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    fileName NVARCHAR(255),
    fileUrl NVARCHAR(500),
    createdAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Attachment_Task FOREIGN KEY (taskId) REFERENCES Task(taskId)
)
--Bảng Activity
CREATE TABLE Activity (
    activityId INT IDENTITY(1,1) PRIMARY KEY,
    taskId INT NOT NULL,
    userId INT NOT NULL,
    action NVARCHAR(255),
    createdAt DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_Activity_Task FOREIGN KEY (taskId) REFERENCES Task(taskId),
    CONSTRAINT FK_Activity_User FOREIGN KEY (userId) REFERENCES [User](userId)
)
Select * from Attachment

CREATE INDEX IDX_Task_ListId ON Task(listId);


CREATE INDEX IDX_ChecklistItem_TaskId ON ChecklistItem(taskId);


CREATE INDEX IDX_Comment_TaskId ON Comment(taskId);


CREATE INDEX IDX_Activity_TaskId ON Activity(taskId);


CREATE INDEX IDX_WM_User ON WorkspaceMember(userId);

-- Đăng ký
CREATE PROCEDURE sp_User_Register
    @email NVARCHAR(255),
    @password NVARCHAR(255),
    @fullName NVARCHAR(255)
AS
BEGIN
    INSERT INTO [User](email, password, fullName)
    VALUES (@email, @password, @fullName)
END
GO

-- Đăng nhập
CREATE PROCEDURE sp_User_Login
    @email NVARCHAR(255),
    @password NVARCHAR(255)
AS
BEGIN
    SELECT * 
    FROM [User]
    WHERE email = @email 
      AND password = @password
END
GO

-- Lay thong tin user hien tai (phuc vu GET /api/users/me)
CREATE OR ALTER PROCEDURE sp_User_GetMe
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        userId,
        fullName,
        email
    FROM [User]
    WHERE userId = @userId;
END
GO

-- Lay danh sach workspace cua user (phuc vu GET /api/workspaces)
CREATE OR ALTER PROCEDURE sp_Workspace_GetByUser
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        w.workspaceId,
        w.name,
        CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE CAST(
                CASE
                    WHEN wm.userId IS NOT NULL THEN ISNULL(wm.role, N'Member')
                    WHEN pmw.hasProjectAccess = 1 THEN N'Member'
                    ELSE N'Member'
                END
                AS NVARCHAR(50)
            )
        END AS role
    FROM Workspace w
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
    OUTER APPLY (
        SELECT TOP 1 1 AS hasProjectAccess
        FROM Project p
        INNER JOIN ProjectMember pm
            ON pm.projectId = p.projectId
           AND pm.userId = @userId
        WHERE p.workspaceId = w.workspaceId
    ) pmw
    WHERE w.ownerId = @userId
       OR wm.userId = @userId
       OR pmw.hasProjectAccess = 1
    ORDER BY w.createdAt DESC;
END
GO

-- Tao workspace moi (phuc vu POST /api/workspaces)
CREATE OR ALTER PROCEDURE sp_Workspace_Create
    @name NVARCHAR(255),
    @ownerId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @newWorkspaceId INT;

    INSERT INTO Workspace (name, ownerId)
    VALUES (@name, @ownerId);

    SET @newWorkspaceId = SCOPE_IDENTITY();

    IF NOT EXISTS (
        SELECT 1
        FROM WorkspaceMember
        WHERE userId = @ownerId
          AND workspaceId = @newWorkspaceId
    )
    BEGIN
        INSERT INTO WorkspaceMember (userId, workspaceId, role)
        VALUES (@ownerId, @newWorkspaceId, N'Owner');
    END

    SELECT
        w.workspaceId,
        w.name,
        CAST(N'Owner' AS NVARCHAR(50)) AS role
    FROM Workspace w
    WHERE w.workspaceId = @newWorkspaceId;
END
GO

-- Cap nhat workspace (phuc vu PUT /api/workspaces/:workspaceId)
CREATE OR ALTER PROCEDURE sp_Workspace_Update
    @workspaceId INT,
    @name NVARCHAR(255),
    @description NVARCHAR(MAX) = NULL,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace
        WHERE workspaceId = @workspaceId
    )
    BEGIN
        RAISERROR(N'Không tìm thấy Workspace', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        WHERE w.workspaceId = @workspaceId
          AND w.ownerId = @userId
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    UPDATE Workspace
    SET
        name = @name,
        description = @description
    WHERE workspaceId = @workspaceId;

    SELECT
        w.workspaceId,
        w.name,
        w.description,
        w.ownerId,
        w.createdAt
    FROM Workspace w
    WHERE w.workspaceId = @workspaceId;
END
GO

-- Xoa workspace (phuc vu DELETE /api/workspaces/:workspaceId)
CREATE OR ALTER PROCEDURE sp_Workspace_Delete
    @workspaceId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace
        WHERE workspaceId = @workspaceId
    )
    BEGIN
        RAISERROR(N'Không tìm thấy Workspace', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        WHERE w.workspaceId = @workspaceId
          AND w.ownerId = @userId
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM Project p
        WHERE p.workspaceId = @workspaceId
    )
    BEGIN
        RAISERROR(N'Không thể xóa Workspace vì vẫn còn Project', 16, 1);
        RETURN;
    END

    DELETE FROM WorkspaceMember
    WHERE workspaceId = @workspaceId;

    DELETE FROM Workspace
    WHERE workspaceId = @workspaceId;

    SELECT CAST(N'Xóa Workspace thành công' AS NVARCHAR(255)) AS message;
END
GO

-- Lay danh sach member trong workspace (phuc vu GET /api/workspaces/:workspaceId/members)
CREATE OR ALTER PROCEDURE sp_WorkspaceMember_GetByWorkspace
    @workspaceId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
          AND (w.ownerId = @userId OR wm.userId = @userId)
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT
        u.userId,
        u.fullName,
        u.email,
        CAST(
            CASE
                WHEN w.ownerId = u.userId THEN N'Owner'
                ELSE ISNULL(wm.role, N'Member')
            END AS NVARCHAR(50)
        ) AS role,
        wm.joinedAt
    FROM Workspace w
    INNER JOIN [User] u
        ON u.userId = w.ownerId
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = u.userId
    WHERE w.workspaceId = @workspaceId

    UNION ALL

    SELECT
        u.userId,
        u.fullName,
        u.email,
        CAST(ISNULL(wm.role, N'Member') AS NVARCHAR(50)) AS role,
        wm.joinedAt
    FROM WorkspaceMember wm
    INNER JOIN [User] u ON u.userId = wm.userId
    INNER JOIN Workspace w ON w.workspaceId = wm.workspaceId
    WHERE wm.workspaceId = @workspaceId
      AND wm.userId <> w.ownerId
    ORDER BY role DESC, fullName ASC;
END
GO

-- Them member vao workspace theo email (phuc vu POST /api/workspaces/:workspaceId/members)
CREATE OR ALTER PROCEDURE sp_WorkspaceMember_Add
    @workspaceId INT,
    @email NVARCHAR(255),
    @role NVARCHAR(50),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @requesterRole NVARCHAR(50);
    DECLARE @targetUserId INT;
    DECLARE @projectRole NVARCHAR(50);
    DECLARE @workspaceMemberId INT;

    SELECT
        @requesterRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(wm.role, N'')
        END
    FROM Workspace w
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
    WHERE w.workspaceId = @workspaceId;

    IF @requesterRole IS NULL OR @requesterRole = N''
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @requesterRole NOT IN (N'Owner', N'Admin')
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @role NOT IN (N'Admin', N'Member')
    BEGIN
        RAISERROR(N'Role không hợp lệ', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin' AND @role <> N'Member'
    BEGIN
        RAISERROR(N'Admin chỉ có thể gán quyền Member', 16, 1);
        RETURN;
    END

    SELECT @targetUserId = u.userId
    FROM [User] u
    WHERE u.email = @email;

    IF @targetUserId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy người dùng', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM Workspace w
        WHERE w.workspaceId = @workspaceId
          AND w.ownerId = @targetUserId
    )
    BEGIN
        RAISERROR(N'Người dùng đã là Owner của Workspace', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM WorkspaceMember wm
        WHERE wm.workspaceId = @workspaceId
          AND wm.userId = @targetUserId
    )
    BEGIN
        RAISERROR(N'Người dùng đã là thành viên của Workspace', 16, 1);
        RETURN;
    END

    INSERT INTO WorkspaceMember (userId, workspaceId, role)
    VALUES (@targetUserId, @workspaceId, @role);

    SET @workspaceMemberId = SCOPE_IDENTITY();

    SET @projectRole = CASE WHEN @role = N'Admin' THEN N'Admin' ELSE N'Member' END;

    MERGE ProjectMember AS target
    USING (
        SELECT p.projectId
        FROM Project p
        WHERE p.workspaceId = @workspaceId
    ) AS source
    ON target.projectId = source.projectId
       AND target.userId = @targetUserId
    WHEN MATCHED THEN
        UPDATE SET role = @projectRole
    WHEN NOT MATCHED THEN
        INSERT (userId, projectId, role)
        VALUES (@targetUserId, source.projectId, @projectRole);

    SELECT
        u.userId,
        u.fullName,
        u.email,
        wm.role,
        wm.joinedAt
    FROM WorkspaceMember wm
    INNER JOIN [User] u ON u.userId = wm.userId
    WHERE wm.id = @workspaceMemberId;
END
GO

-- Cap nhat role member trong workspace (phuc vu PUT /api/workspaces/:workspaceId/members/:memberUserId/role)
CREATE OR ALTER PROCEDURE sp_WorkspaceMember_UpdateRole
    @workspaceId INT,
    @memberUserId INT,
    @role NVARCHAR(50),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @requesterRole NVARCHAR(50);
    DECLARE @targetRole NVARCHAR(50);
    DECLARE @ownerId INT;

    SELECT
        @ownerId = w.ownerId,
        @requesterRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(wm.role, N'')
        END
    FROM Workspace w
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
    WHERE w.workspaceId = @workspaceId;

    IF @requesterRole IS NULL OR @requesterRole = N''
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @requesterRole NOT IN (N'Owner', N'Admin')
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @role NOT IN (N'Admin', N'Member')
    BEGIN
        RAISERROR(N'Role không hợp lệ', 16, 1);
        RETURN;
    END

    IF @memberUserId = @ownerId
    BEGIN
        RAISERROR(N'Không thể thay đổi quyền của Owner', 16, 1);
        RETURN;
    END

    SELECT @targetRole = wm.role
    FROM WorkspaceMember wm
    WHERE wm.workspaceId = @workspaceId
      AND wm.userId = @memberUserId;

    IF @targetRole IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy thành viên trong Workspace', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin'
    BEGIN
        IF @targetRole <> N'Member' OR @role <> N'Member'
        BEGIN
            RAISERROR(N'Admin chỉ có thể gán quyền Member', 16, 1);
            RETURN;
        END
    END

    UPDATE WorkspaceMember
    SET role = @role
    WHERE workspaceId = @workspaceId
      AND userId = @memberUserId;

        UPDATE pm
        SET pm.role = CASE WHEN @role = N'Admin' THEN N'Admin' ELSE N'Member' END
        FROM ProjectMember pm
        INNER JOIN Project p ON p.projectId = pm.projectId
        WHERE p.workspaceId = @workspaceId
            AND pm.userId = @memberUserId;

    SELECT
        u.userId,
        u.fullName,
        u.email,
        wm.role,
        wm.joinedAt
    FROM WorkspaceMember wm
    INNER JOIN [User] u ON u.userId = wm.userId
    WHERE wm.workspaceId = @workspaceId
      AND wm.userId = @memberUserId;
END
GO

-- Xoa member khoi workspace (phuc vu DELETE /api/workspaces/:workspaceId/members/:memberUserId)
CREATE OR ALTER PROCEDURE sp_WorkspaceMember_Remove
    @workspaceId INT,
    @memberUserId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @requesterRole NVARCHAR(50);
    DECLARE @targetRole NVARCHAR(50);
    DECLARE @ownerId INT;

    SELECT
        @ownerId = w.ownerId,
        @requesterRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(wm.role, N'')
        END
    FROM Workspace w
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
    WHERE w.workspaceId = @workspaceId;

    IF @requesterRole IS NULL OR @requesterRole = N''
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @memberUserId = @ownerId
    BEGIN
        RAISERROR(N'Không thể xóa Owner khỏi Workspace', 16, 1);
        RETURN;
    END

    SELECT @targetRole = wm.role
    FROM WorkspaceMember wm
    WHERE wm.workspaceId = @workspaceId
      AND wm.userId = @memberUserId;

    IF @targetRole IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy thành viên trong Workspace', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin' AND @targetRole <> N'Member'
    BEGIN
        RAISERROR(N'Admin chỉ có thể xóa Member', 16, 1);
        RETURN;
    END

    IF @requesterRole NOT IN (N'Owner', N'Admin')
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

        DELETE pm
        FROM ProjectMember pm
        INNER JOIN Project p ON p.projectId = pm.projectId
        WHERE p.workspaceId = @workspaceId
            AND pm.userId = @memberUserId;

        DELETE FROM WorkspaceMember
    WHERE workspaceId = @workspaceId
      AND userId = @memberUserId;

    SELECT CAST(N'Xóa thành viên khỏi Workspace thành công' AS NVARCHAR(255)) AS message;
END
GO

-- Dong bo quyen ProjectMember theo role cua WorkspaceMember (hoac owner)
CREATE OR ALTER PROCEDURE sp_ProjectMember_SyncByWorkspaceUser
    @workspaceId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @resolvedRole NVARCHAR(50);
    DECLARE @projectRole NVARCHAR(50);

    SELECT
        @resolvedRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(wm.role, N'')
        END
    FROM Workspace w
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
    WHERE w.workspaceId = @workspaceId;

    IF @resolvedRole IS NULL OR @resolvedRole = N''
    BEGIN
        RAISERROR(N'Forbidden', 16, 1);
        RETURN;
    END

    IF @resolvedRole = N'Owner'
    BEGIN
        RETURN;
    END

    SET @projectRole = CASE WHEN @resolvedRole = N'Admin' THEN N'Admin' ELSE N'Member' END;

    MERGE ProjectMember AS target
    USING (
        SELECT p.projectId
        FROM Project p
        WHERE p.workspaceId = @workspaceId
    ) AS source
    ON target.projectId = source.projectId
       AND target.userId = @userId
    WHEN MATCHED THEN
        UPDATE SET role = @projectRole
    WHEN NOT MATCHED THEN
        INSERT (userId, projectId, role)
        VALUES (@userId, source.projectId, @projectRole);
END
GO

-- Dong bo quyen ProjectMember cho mot member trong toan bo project cua workspace
CREATE OR ALTER PROCEDURE sp_ProjectMember_SyncWorkspaceMember
    @workspaceId INT,
    @memberUserId INT,
    @role NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @projectRole NVARCHAR(50);

    IF @role NOT IN (N'Admin', N'Member')
    BEGIN
        RAISERROR(N'Role không hợp lệ', 16, 1);
        RETURN;
    END

    SET @projectRole = CASE WHEN @role = N'Admin' THEN N'Admin' ELSE N'Member' END;

    MERGE ProjectMember AS target
    USING (
        SELECT p.projectId
        FROM Project p
        WHERE p.workspaceId = @workspaceId
    ) AS source
    ON target.projectId = source.projectId
       AND target.userId = @memberUserId
    WHEN MATCHED THEN
        UPDATE SET role = @projectRole
    WHEN NOT MATCHED THEN
        INSERT (userId, projectId, role)
        VALUES (@memberUserId, source.projectId, @projectRole);
END
GO

-- Xoa quyen ProjectMember cua member trong toan bo project cua workspace
CREATE OR ALTER PROCEDURE sp_ProjectMember_RemoveByWorkspaceMember
    @workspaceId INT,
    @memberUserId INT
AS
BEGIN
    SET NOCOUNT ON;

    DELETE pm
    FROM ProjectMember pm
    INNER JOIN Project p ON p.projectId = pm.projectId
    WHERE p.workspaceId = @workspaceId
      AND pm.userId = @memberUserId;
END
GO

-- Lay danh sach project theo workspace (phuc vu GET /api/projects?workspaceId=...)
CREATE OR ALTER PROCEDURE sp_Project_GetByWorkspace
    @workspaceId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
             AND (
                     w.ownerId = @userId
                 OR wm.userId = @userId
                 OR EXISTS (
                          SELECT 1
                          FROM Project p0
                          INNER JOIN ProjectMember pm0
                                ON pm0.projectId = p0.projectId
                              AND pm0.userId = @userId
                          WHERE p0.workspaceId = @workspaceId
                 )
             )
    )
    BEGIN
        RAISERROR(N'Forbidden', 16, 1);
        RETURN;
    END

    SELECT
        p.projectId,
        p.name,
        p.description,
        CAST(p.createdAt AS DATE) AS createdAt
    FROM Project p
    LEFT JOIN Workspace w
        ON w.workspaceId = p.workspaceId
    LEFT JOIN WorkspaceMember wm
        ON wm.workspaceId = w.workspaceId
       AND wm.userId = @userId
    LEFT JOIN ProjectMember pm
        ON pm.projectId = p.projectId
       AND pm.userId = @userId
    WHERE p.workspaceId = @workspaceId
      AND (
          w.ownerId = @userId
          OR wm.userId = @userId
          OR pm.userId = @userId
      )
    ORDER BY p.createdAt DESC;
END
GO

-- Tao project moi (phuc vu POST /api/projects)
CREATE OR ALTER PROCEDURE sp_Project_Create
    @workspaceId INT,
    @name NVARCHAR(255),
    @description NVARCHAR(MAX) = NULL,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
          AND (w.ownerId = @userId OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin'))
    )
    BEGIN
        RAISERROR(N'Forbidden', 16, 1);
        RETURN;
    END

    DECLARE @newProjectId INT;

    INSERT INTO Project (workspaceId, name, description)
    VALUES (@workspaceId, @name, @description);

    SET @newProjectId = SCOPE_IDENTITY();

    IF NOT EXISTS (
        SELECT 1
        FROM ProjectMember
        WHERE userId = @userId
          AND projectId = @newProjectId
    )
    BEGIN
        INSERT INTO ProjectMember (userId, projectId, role)
        VALUES (@userId, @newProjectId, N'Owner');
    END

    SELECT
        p.projectId,
        p.name,
        p.description,
        CAST(p.createdAt AS DATE) AS createdAt
    FROM Project p
    WHERE p.projectId = @newProjectId;
END
GO

-- Sua project (phuc vu PUT /api/projects/:projectId)
CREATE OR ALTER PROCEDURE sp_Project_Update
    @projectId INT,
    @name NVARCHAR(255),
    @description NVARCHAR(MAX) = NULL,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;

    SELECT @workspaceId = p.workspaceId
    FROM Project p
    WHERE p.projectId = @projectId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Project', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Project p
        INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
        LEFT JOIN ProjectMember pm
            ON pm.projectId = p.projectId
           AND pm.userId = @userId
        WHERE p.projectId = @projectId
          AND (
              w.ownerId = @userId
              OR ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
          )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    UPDATE Project
    SET
        name = @name,
        description = @description
    WHERE projectId = @projectId;

    SELECT
        p.projectId,
        p.name,
        p.description,
        CAST(GETDATE() AS DATE) AS updatedAt
    FROM Project p
    WHERE p.projectId = @projectId;
END
GO

-- Xoa project (phuc vu DELETE /api/projects/:projectId)
CREATE OR ALTER PROCEDURE sp_Project_Delete
    @projectId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;

    SELECT @workspaceId = p.workspaceId
    FROM Project p
    WHERE p.projectId = @projectId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Project', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Project p
        INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
        LEFT JOIN ProjectMember pm
            ON pm.projectId = p.projectId
           AND pm.userId = @userId
        WHERE p.projectId = @projectId
          AND (
              w.ownerId = @userId
              OR ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
          )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    -- Xóa toàn bộ dữ liệu Kanban thuộc project trước khi xóa project
    DELETE ta
    FROM TaskAssignee ta
    INNER JOIN Task t ON t.taskId = ta.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE c
    FROM Comment c
    INNER JOIN Task t ON t.taskId = c.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE a
    FROM Attachment a
    INNER JOIN Task t ON t.taskId = a.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE ac
    FROM Activity ac
    INNER JOIN Task t ON t.taskId = ac.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE ci
    FROM ChecklistItem ci
    INNER JOIN Task t ON t.taskId = ci.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE t
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE l
    FROM [List] l
    INNER JOIN Board b ON b.boardId = l.boardId
    WHERE b.projectId = @projectId;

    DELETE FROM Board
    WHERE projectId = @projectId;

    DELETE FROM ProjectMember
    WHERE projectId = @projectId;

    DELETE FROM Project
    WHERE projectId = @projectId;

    SELECT CAST(N'Đã xóa dự án thành công.' AS NVARCHAR(255)) AS message;
END
GO

-- Lay danh sach member trong project (phuc vu GET /api/projects/:projectId/members)
CREATE OR ALTER PROCEDURE sp_ProjectMember_GetByProject
    @projectId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @ownerId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @ownerId = w.ownerId
    FROM Project p
    INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
    WHERE p.projectId = @projectId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Project', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Project p
        INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
        LEFT JOIN ProjectMember pm
            ON pm.projectId = p.projectId
           AND pm.userId = @userId
        WHERE p.projectId = @projectId
          AND (w.ownerId = @userId OR pm.userId = @userId)
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT
        u.userId,
        u.fullName,
        u.email,
        CAST(
            CASE
                WHEN u.userId = @ownerId THEN N'Owner'
                ELSE ISNULL(pm.role, N'Member')
            END AS NVARCHAR(50)
        ) AS role,
        CASE
            WHEN u.userId = @ownerId THEN p.createdAt
            ELSE pm.joinedAt
        END AS joinedAt
    FROM [User] u
    INNER JOIN Project p ON p.projectId = @projectId
    LEFT JOIN ProjectMember pm
        ON pm.projectId = @projectId
       AND pm.userId = u.userId
    WHERE u.userId = @ownerId
       OR pm.userId IS NOT NULL
    ORDER BY role DESC, fullName ASC;
END
GO

-- Them member vao project theo email (phuc vu POST /api/projects/:projectId/members)
CREATE OR ALTER PROCEDURE sp_ProjectMember_Add
    @projectId INT,
    @email NVARCHAR(255),
    @role NVARCHAR(50),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @ownerId INT;
    DECLARE @requesterRole NVARCHAR(50);
    DECLARE @targetUserId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @ownerId = w.ownerId,
        @requesterRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(pm.role, N'')
        END
    FROM Project p
    INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
    LEFT JOIN ProjectMember pm
        ON pm.projectId = p.projectId
       AND pm.userId = @userId
    WHERE p.projectId = @projectId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Project', 16, 1);
        RETURN;
    END

    IF @requesterRole NOT IN (N'Owner', N'Admin')
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @role NOT IN (N'Admin', N'Member')
    BEGIN
        RAISERROR(N'Role không hợp lệ', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin' AND @role <> N'Member'
    BEGIN
        RAISERROR(N'Admin chỉ có thể gán quyền Member', 16, 1);
        RETURN;
    END

    SELECT @targetUserId = u.userId
    FROM [User] u
    WHERE u.email = @email;

    IF @targetUserId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy người dùng', 16, 1);
        RETURN;
    END

    IF @targetUserId = @ownerId
    BEGIN
        RAISERROR(N'Người dùng đã là Owner của Project', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM ProjectMember pm
        WHERE pm.projectId = @projectId
          AND pm.userId = @targetUserId
    )
    BEGIN
        UPDATE ProjectMember
        SET role = @role
        WHERE projectId = @projectId
          AND userId = @targetUserId;
    END
    ELSE
    BEGIN
        INSERT INTO ProjectMember (userId, projectId, role)
        VALUES (@targetUserId, @projectId, @role);
    END

    SELECT
        u.userId,
        u.fullName,
        u.email,
        CAST(pm.role AS NVARCHAR(50)) AS role,
        pm.joinedAt
    FROM ProjectMember pm
    INNER JOIN [User] u ON u.userId = pm.userId
    WHERE pm.projectId = @projectId
      AND pm.userId = @targetUserId;
END
GO

-- Cap nhat role member trong project (phuc vu PUT /api/projects/:projectId/members/:memberUserId/role)
CREATE OR ALTER PROCEDURE sp_ProjectMember_UpdateRole
    @projectId INT,
    @memberUserId INT,
    @role NVARCHAR(50),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ownerId INT;
    DECLARE @requesterRole NVARCHAR(50);
    DECLARE @targetRole NVARCHAR(50);

    SELECT
        @ownerId = w.ownerId,
        @requesterRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(pm.role, N'')
        END
    FROM Project p
    INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
    LEFT JOIN ProjectMember pm
        ON pm.projectId = p.projectId
       AND pm.userId = @userId
    WHERE p.projectId = @projectId;

    IF @requesterRole NOT IN (N'Owner', N'Admin')
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @role NOT IN (N'Admin', N'Member')
    BEGIN
        RAISERROR(N'Role không hợp lệ', 16, 1);
        RETURN;
    END

    IF @memberUserId = @ownerId
    BEGIN
        RAISERROR(N'Không thể thay đổi quyền của Owner', 16, 1);
        RETURN;
    END

    SELECT @targetRole = pm.role
    FROM ProjectMember pm
    WHERE pm.projectId = @projectId
      AND pm.userId = @memberUserId;

    IF @targetRole IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy thành viên trong Project', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin' AND @targetRole <> N'Member'
    BEGIN
        RAISERROR(N'Admin chỉ có thể thay đổi quyền Member', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin' AND @role <> N'Member'
    BEGIN
        RAISERROR(N'Admin chỉ có thể gán quyền Member', 16, 1);
        RETURN;
    END

    UPDATE ProjectMember
    SET role = @role
    WHERE projectId = @projectId
      AND userId = @memberUserId;

    SELECT
        u.userId,
        u.fullName,
        u.email,
        CAST(pm.role AS NVARCHAR(50)) AS role,
        pm.joinedAt
    FROM ProjectMember pm
    INNER JOIN [User] u ON u.userId = pm.userId
    WHERE pm.projectId = @projectId
      AND pm.userId = @memberUserId;
END
GO

-- Xoa member khoi project (phuc vu DELETE /api/projects/:projectId/members/:memberUserId)
CREATE OR ALTER PROCEDURE sp_ProjectMember_Remove
    @projectId INT,
    @memberUserId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ownerId INT;
    DECLARE @requesterRole NVARCHAR(50);
    DECLARE @targetRole NVARCHAR(50);

    SELECT
        @ownerId = w.ownerId,
        @requesterRole = CASE
            WHEN w.ownerId = @userId THEN N'Owner'
            ELSE ISNULL(pm.role, N'')
        END
    FROM Project p
    INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
    LEFT JOIN ProjectMember pm
        ON pm.projectId = p.projectId
       AND pm.userId = @userId
    WHERE p.projectId = @projectId;

    IF @requesterRole NOT IN (N'Owner', N'Admin')
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @memberUserId = @ownerId
    BEGIN
        RAISERROR(N'Không thể xóa Owner khỏi Project', 16, 1);
        RETURN;
    END

    SELECT @targetRole = pm.role
    FROM ProjectMember pm
    WHERE pm.projectId = @projectId
      AND pm.userId = @memberUserId;

    IF @targetRole IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy thành viên trong Project', 16, 1);
        RETURN;
    END

    IF @requesterRole = N'Admin' AND @targetRole <> N'Member'
    BEGIN
        RAISERROR(N'Admin chỉ có thể xóa Member', 16, 1);
        RETURN;
    END

    DELETE FROM ProjectMember
    WHERE projectId = @projectId
      AND userId = @memberUserId;

    SELECT CAST(N'Xóa thành viên khỏi Project thành công' AS NVARCHAR(255)) AS message;
END
GO

-- Lay du lieu board (phuc vu GET /api/boards/:boardId)
CREATE OR ALTER PROCEDURE sp_Board_GetDetail
    @boardId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @resolvedBoardId INT;
    DECLARE @projectId INT;
    DECLARE @workspaceId INT;
    DECLARE @defaultBoardName NVARCHAR(255);

    -- Uu tien xem @boardId nhu projectId truoc de tranh xung dot ID
    SELECT
        @projectId = p.projectId,
        @workspaceId = p.workspaceId
    FROM Project p
    WHERE p.projectId = @boardId;

    IF @projectId IS NOT NULL
    BEGIN
        SELECT TOP 1 @resolvedBoardId = b.boardId
        FROM Board b
        WHERE b.projectId = @projectId
        ORDER BY b.createdAt ASC, b.boardId ASC;
    END

    IF @projectId IS NULL
    BEGIN
        SELECT
            @resolvedBoardId = b.boardId,
            @projectId = p.projectId,
            @workspaceId = p.workspaceId
        FROM Board b
        INNER JOIN Project p ON p.projectId = b.projectId
        WHERE b.boardId = @boardId;

        IF @projectId IS NULL
        BEGIN
            RAISERROR(N'Không tìm thấy Board', 16, 1);
            RETURN;
        END
    END

    IF NOT EXISTS (
        SELECT 1
                FROM Project p
                INNER JOIN Workspace w ON w.workspaceId = p.workspaceId
            LEFT JOIN WorkspaceMember wm
                ON wm.workspaceId = w.workspaceId
                 AND wm.userId = @userId
                LEFT JOIN ProjectMember pm
                        ON pm.projectId = p.projectId
                     AND pm.userId = @userId
                WHERE p.projectId = @projectId
                AND (w.ownerId = @userId OR wm.userId = @userId OR pm.userId = @userId)
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @resolvedBoardId IS NULL
    BEGIN
        SELECT TOP 1 @resolvedBoardId = b.boardId
        FROM Board b
        WHERE b.projectId = @projectId
        ORDER BY b.createdAt ASC, b.boardId ASC;

        IF @resolvedBoardId IS NULL
        BEGIN
            SELECT @defaultBoardName = LEFT(ISNULL(p.name, N'Board mặc định'), 255)
            FROM Project p
            WHERE p.projectId = @projectId;

            INSERT INTO Board (projectId, name)
            VALUES (@projectId, ISNULL(@defaultBoardName, N'Board mặc định'));

            SET @resolvedBoardId = SCOPE_IDENTITY();
        END
    END

    SELECT
        b.boardId,
        b.name
    FROM Board b
    WHERE b.boardId = @resolvedBoardId;

    SELECT
        l.listId,
        l.name,
        l.position
    FROM [List] l
    WHERE l.boardId = @resolvedBoardId
    ORDER BY l.position ASC, l.listId ASC;

    SELECT
        t.taskId,
        t.listId,
        t.title,
        ISNULL(t.position, 0) AS position
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    WHERE l.boardId = @resolvedBoardId
    ORDER BY t.listId ASC, t.position ASC, t.taskId ASC;
END
GO

-- Tao list moi (phuc vu POST /api/lists)
CREATE OR ALTER PROCEDURE sp_List_Create
    @name NVARCHAR(255),
    @boardId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @resolvedBoardId INT;
    DECLARE @projectId INT;
    DECLARE @workspaceId INT;
    DECLARE @nextPosition INT;
    DECLARE @defaultBoardName NVARCHAR(255);

    SELECT
        @resolvedBoardId = b.boardId,
        @projectId = b.projectId,
        @workspaceId = p.workspaceId
    FROM Board b
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE b.boardId = @boardId;

    IF @resolvedBoardId IS NULL
    BEGIN
        SELECT
            @projectId = p.projectId,
            @workspaceId = p.workspaceId
        FROM Project p
        WHERE p.projectId = @boardId;

        IF @projectId IS NULL
        BEGIN
            RAISERROR(N'Không tìm thấy Board', 16, 1);
            RETURN;
        END
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                                            AND ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @resolvedBoardId IS NULL
    BEGIN
        SELECT TOP 1 @resolvedBoardId = b.boardId
        FROM Board b
        WHERE b.projectId = @projectId
        ORDER BY b.createdAt ASC, b.boardId ASC;

        IF @resolvedBoardId IS NULL
        BEGIN
            SELECT @defaultBoardName = LEFT(ISNULL(p.name, N'Board mặc định'), 255)
            FROM Project p
            WHERE p.projectId = @projectId;

            INSERT INTO Board (projectId, name)
            VALUES (@projectId, ISNULL(@defaultBoardName, N'Board mặc định'));

            SET @resolvedBoardId = SCOPE_IDENTITY();
        END
    END

    SELECT @nextPosition = ISNULL(MAX(position), 0) + 1
    FROM [List]
    WHERE boardId = @resolvedBoardId;

    INSERT INTO [List] (boardId, name, position)
    VALUES (@resolvedBoardId, @name, @nextPosition);

    SELECT
        l.listId,
        l.boardId,
        l.name,
        l.position
    FROM [List] l
    WHERE l.listId = SCOPE_IDENTITY();
END
GO

-- Cap nhat tieu de list (phuc vu PUT /api/lists/:listId)
CREATE OR ALTER PROCEDURE sp_List_Update
    @listId INT,
    @name NVARCHAR(255),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @boardId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @boardId = l.boardId,
        @projectId = p.projectId
    FROM [List] l
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE l.listId = @listId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy List', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                                            AND ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    UPDATE [List]
    SET name = @name
    WHERE listId = @listId;

    SELECT
        l.listId,
        l.boardId,
        l.name,
        l.position
    FROM [List] l
    WHERE l.listId = @listId;
END
GO

-- Xoa list (phuc vu DELETE /api/lists/:listId)
CREATE OR ALTER PROCEDURE sp_List_Delete
    @listId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @boardId INT;
    DECLARE @projectId INT;
    DECLARE @listPosition INT;

    SELECT
        @workspaceId = p.workspaceId,
        @boardId = l.boardId,
        @projectId = p.projectId,
        @listPosition = l.position
    FROM [List] l
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE l.listId = @listId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy List', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                                            AND ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    DELETE ta
    FROM TaskAssignee ta
    INNER JOIN Task t ON t.taskId = ta.taskId
    WHERE t.listId = @listId;

    DELETE c
    FROM Comment c
    INNER JOIN Task t ON t.taskId = c.taskId
    WHERE t.listId = @listId;

    DELETE a
    FROM Attachment a
    INNER JOIN Task t ON t.taskId = a.taskId
    WHERE t.listId = @listId;

    DELETE ac
    FROM Activity ac
    INNER JOIN Task t ON t.taskId = ac.taskId
    WHERE t.listId = @listId;

    DELETE ci
    FROM ChecklistItem ci
    INNER JOIN Task t ON t.taskId = ci.taskId
    WHERE t.listId = @listId;

    DELETE FROM Task WHERE listId = @listId;

    DELETE FROM [List] WHERE listId = @listId;

    UPDATE [List]
    SET position = position - 1
    WHERE boardId = @boardId
      AND position > ISNULL(@listPosition, 0);

    SELECT CAST(N'Đã xóa danh sách nhiệm vụ thành công.' AS NVARCHAR(255)) AS message;
END
GO

-- Tao task moi (phuc vu POST /api/tasks)
CREATE OR ALTER PROCEDURE sp_Task_Create
    @title NVARCHAR(255),
    @label NVARCHAR(100) = NULL,
    @listId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @nextPosition INT;
    DECLARE @newTaskId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM [List] l
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE l.listId = @listId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy List', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT @nextPosition = ISNULL(MAX(ISNULL(position, 0)), 0) + 1
    FROM Task
    WHERE listId = @listId;

    INSERT INTO Task (listId, title, label, position)
    VALUES (@listId, @title, @label, @nextPosition);

    SET @newTaskId = SCOPE_IDENTITY();

    IF NOT EXISTS (
        SELECT 1
        FROM TaskAssignee
        WHERE taskId = @newTaskId
          AND userId = @userId
    )
    BEGIN
        INSERT INTO TaskAssignee (taskId, userId)
        VALUES (@newTaskId, @userId);
    END

    SELECT
        t.taskId,
        t.listId,
        t.title,
        t.label,
        t.description,
        t.dueDate,
        t.priority,
        t.status,
        ISNULL(t.position, 0) AS position
    FROM Task t
    WHERE t.taskId = @newTaskId;
END
GO

-- Lay chi tiet task dang JSON (phuc vu GET /api/tasks/:taskId)
CREATE OR ALTER PROCEDURE sp_Task_GetDetail_Json
    @taskId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT (
        SELECT
            t.taskId,
            t.listId,
            t.title,
            t.label,
            t.description,
            t.dueDate,
            t.priority,
            t.status,
            ISNULL(t.position, 0) AS position,
            t.createdAt,
            CAST(NULL AS DATETIME) AS updatedAt,
            JSON_QUERY(
                (
                    SELECT
                        ta.userId,
                        u.fullName
                    FROM TaskAssignee ta
                    INNER JOIN [User] u ON u.userId = ta.userId
                    WHERE ta.taskId = t.taskId
                    ORDER BY ta.id ASC
                    FOR JSON PATH
                )
            ) AS assignees,
            JSON_QUERY(
                (
                    SELECT
                        ci.id,
                        ci.content,
                        ci.isCompleted,
                        ci.position
                    FROM ChecklistItem ci
                    WHERE ci.taskId = t.taskId
                    ORDER BY ci.position ASC, ci.id ASC
                    FOR JSON PATH
                )
            ) AS checklist,
            JSON_QUERY(
                (
                    SELECT
                        a.attachmentId,
                        a.fileName,
                        a.fileUrl,
                        a.createdAt
                    FROM Attachment a
                    WHERE a.taskId = t.taskId
                    ORDER BY a.createdAt DESC, a.attachmentId DESC
                    FOR JSON PATH
                )
            ) AS attachments,
            JSON_QUERY(
                (
                    SELECT
                        c.commentId,
                        c.content,
                        c.userId,
                        u.fullName,
                        c.createdAt
                    FROM Comment c
                    INNER JOIN [User] u ON u.userId = c.userId
                    WHERE c.taskId = t.taskId
                    ORDER BY c.createdAt DESC, c.commentId DESC
                    FOR JSON PATH
                )
            ) AS comments,
            JSON_QUERY(
                (
                    SELECT
                        ac.activityId,
                        ac.action,
                        ac.userId,
                        u.fullName,
                        ac.createdAt
                    FROM Activity ac
                    INNER JOIN [User] u ON u.userId = ac.userId
                    WHERE ac.taskId = t.taskId
                    ORDER BY ac.createdAt DESC, ac.activityId DESC
                    FOR JSON PATH
                )
            ) AS activity
        FROM Task t
        WHERE t.taskId = @taskId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    ) AS data;
END
GO

-- Di chuyen task (phuc vu PUT /api/tasks/:taskId/move)
CREATE OR ALTER PROCEDURE sp_Task_Move
    @taskId INT,
    @targetListId INT,
    @position INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @sourceListId INT;
    DECLARE @sourcePosition INT;
    DECLARE @sourceBoardId INT;
    DECLARE @targetBoardId INT;
    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @targetMax INT;

    SELECT
        @sourceListId = t.listId,
        @sourcePosition = ISNULL(t.position, 0),
        @sourceBoardId = b.boardId,
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @sourceListId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    SELECT @targetBoardId = l.boardId
    FROM [List] l
    WHERE l.listId = @targetListId;

    IF @targetBoardId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy List đích', 16, 1);
        RETURN;
    END

    IF @sourceBoardId <> @targetBoardId
    BEGIN
        RAISERROR(N'Chỉ hỗ trợ di chuyển Task trong cùng Board', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
            AND (
                w.ownerId = @userId
             OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                         OR EXISTS (
                                    SELECT 1
                                    FROM ProjectMember pm
                                    WHERE pm.projectId = @projectId
                                        AND pm.userId = @userId
                                )
             OR EXISTS (
                  SELECT 1
                  FROM TaskAssignee ta
                  WHERE ta.taskId = @taskId
                    AND ta.userId = @userId
                )
            )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF @position IS NULL OR @position < 1
    BEGIN
        SET @position = 1;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        UPDATE Task
        SET position = ISNULL(position, 0) - 1
        WHERE listId = @sourceListId
          AND taskId <> @taskId
          AND ISNULL(position, 0) > @sourcePosition;

        SELECT @targetMax = COUNT(1)
        FROM Task
        WHERE listId = @targetListId
          AND taskId <> @taskId;

        IF @position > @targetMax + 1
        BEGIN
            SET @position = @targetMax + 1;
        END

        UPDATE Task
        SET position = ISNULL(position, 0) + 1
        WHERE listId = @targetListId
          AND taskId <> @taskId
          AND ISNULL(position, 0) >= @position;

        UPDATE Task
        SET
            listId = @targetListId,
            position = @position
        WHERE taskId = @taskId;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        DECLARE @errorMessage NVARCHAR(4000);

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        SELECT @errorMessage = ERROR_MESSAGE();
        RAISERROR(@errorMessage, 16, 1);
        RETURN;
    END CATCH

    SELECT
        t.taskId,
        t.listId,
        t.title,
        t.label,
        t.description,
        t.dueDate,
        t.priority,
        t.status,
        ISNULL(t.position, 0) AS position
    FROM Task t
    WHERE t.taskId = @taskId;
END
GO

-- Sua task (phuc vu PUT /api/tasks/:taskId)
CREATE OR ALTER PROCEDURE sp_Task_Update
    @taskId INT,
    @title NVARCHAR(255) = NULL,
    @label NVARCHAR(100) = NULL,
    @clearLabel BIT = 0,
    @description NVARCHAR(MAX) = NULL,
    @dueDate DATETIME = NULL,
    @priority NVARCHAR(50) = NULL,
    @status NVARCHAR(50) = NULL,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @isLabelOnlyUpdate BIT;

    SET @isLabelOnlyUpdate = CASE
        WHEN @title IS NULL
         AND (@label IS NOT NULL OR @clearLabel = 1)
         AND @description IS NULL
         AND @dueDate IS NULL
         AND @priority IS NULL
         AND @status IS NULL
        THEN 1
        ELSE 0
    END;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
            AND (
                w.ownerId = @userId
             OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
             OR EXISTS (
                    SELECT 1
                    FROM ProjectMember pm
                    WHERE pm.projectId = @projectId
                        AND pm.userId = @userId
                )
             OR EXISTS (
                  SELECT 1
                  FROM TaskAssignee ta
                  WHERE ta.taskId = @taskId
                    AND ta.userId = @userId
                )
            )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

         IF @title IS NULL
                 AND @label IS NULL
             AND @clearLabel = 0
       AND @description IS NULL
       AND @dueDate IS NULL
       AND @priority IS NULL
       AND @status IS NULL
    BEGIN
        RAISERROR(N'Không có dữ liệu để cập nhật', 16, 1);
        RETURN;
    END

    UPDATE Task
    SET
        title = COALESCE(@title, title),
        label = CASE
            WHEN @clearLabel = 1 THEN NULL
            ELSE COALESCE(@label, label)
        END,
        description = COALESCE(@description, description),
        dueDate = COALESCE(@dueDate, dueDate),
        priority = COALESCE(@priority, priority),
        status = COALESCE(@status, status)
    WHERE taskId = @taskId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã cập nhật thông tin nhiệm vụ');

    SELECT
        t.taskId,
        t.listId,
        t.title,
        t.label,
        t.description,
        t.dueDate,
        t.priority,
        t.status,
        ISNULL(t.position, 0) AS position
    FROM Task t
    WHERE t.taskId = @taskId;
END
GO

-- Xoa task (phuc vu DELETE /api/tasks/:taskId)
CREATE OR ALTER PROCEDURE sp_Task_Delete
    @taskId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                                            AND ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    DELETE FROM TaskAssignee WHERE taskId = @taskId;
    DELETE FROM Comment WHERE taskId = @taskId;
    DELETE FROM Attachment WHERE taskId = @taskId;
    DELETE FROM Activity WHERE taskId = @taskId;
    DELETE FROM ChecklistItem WHERE taskId = @taskId;

    DELETE FROM Task WHERE taskId = @taskId;

    SELECT CAST(N'Đã xóa nhiệm vụ thành công.' AS NVARCHAR(255)) AS message;
END
GO

-- Tao checklist item (phuc vu POST /api/checklist-items)
CREATE OR ALTER PROCEDURE sp_ChecklistItem_Create
    @taskId INT,
    @content NVARCHAR(MAX),
    @position INT = NULL,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @maxPosition INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NULLIF(LTRIM(RTRIM(@content)), N'') IS NULL
    BEGIN
        RAISERROR(N'Nội dung checklist không được rỗng', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
          AND (
                w.ownerId = @userId
             OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                 OR EXISTS (
                          SELECT 1
                          FROM ProjectMember pm
                          WHERE pm.projectId = @projectId
                             AND pm.userId = @userId
                 )
                         OR EXISTS (
                                        SELECT 1
                                        FROM TaskAssignee ta
                                        WHERE ta.taskId = @taskId
                                            AND ta.userId = @userId
                                )
          )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT @maxPosition = ISNULL(MAX(position), 0)
    FROM ChecklistItem
    WHERE taskId = @taskId;

    IF @position IS NULL OR @position < 1
    BEGIN
        SET @position = @maxPosition + 1;
    END

    IF @position > @maxPosition + 1
    BEGIN
        SET @position = @maxPosition + 1;
    END

    UPDATE ChecklistItem
    SET position = position + 1
    WHERE taskId = @taskId
      AND position >= @position;

    INSERT INTO ChecklistItem (taskId, content, isCompleted, position)
    VALUES (@taskId, LTRIM(RTRIM(@content)), 0, @position);

    UPDATE Task
    SET status = N'Đang thực hiện'
    WHERE taskId = @taskId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã thêm một mục checklist');

    SELECT
        id,
        taskId,
        content,
        isCompleted,
        position
    FROM ChecklistItem
    WHERE id = SCOPE_IDENTITY();
END
GO

-- Sua checklist item (phuc vu PUT /api/checklist-items/:id)
CREATE OR ALTER PROCEDURE sp_ChecklistItem_Update
    @id INT,
    @content NVARCHAR(MAX),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM ChecklistItem ci
    INNER JOIN Task t ON t.taskId = ci.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE ci.id = @id;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy ChecklistItem', 16, 1);
        RETURN;
    END

    IF NULLIF(LTRIM(RTRIM(@content)), N'') IS NULL
    BEGIN
        RAISERROR(N'Nội dung checklist không được rỗng', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    UPDATE ChecklistItem
    SET content = LTRIM(RTRIM(@content))
    WHERE id = @id;

    SELECT
        id,
        taskId,
        content,
        isCompleted,
        position
    FROM ChecklistItem
    WHERE id = @id;
END
GO

-- Toggle checklist item (phuc vu PATCH /api/checklist-items/:id/toggle)
CREATE OR ALTER PROCEDURE sp_ChecklistItem_Toggle
    @id INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @taskId INT;
    DECLARE @isCompleted BIT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM ChecklistItem ci
    INNER JOIN Task t ON t.taskId = ci.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE ci.id = @id;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy ChecklistItem', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    UPDATE ChecklistItem
    SET isCompleted = CASE WHEN isCompleted = 1 THEN 0 ELSE 1 END
    WHERE id = @id;

    SELECT
        @taskId = ci.taskId,
        @isCompleted = ci.isCompleted
    FROM ChecklistItem ci
    WHERE ci.id = @id;

    UPDATE Task
    SET status = CASE
        WHEN EXISTS (
            SELECT 1
            FROM ChecklistItem ci
            WHERE ci.taskId = (
                SELECT taskId
                FROM ChecklistItem
                WHERE id = @id
            )
        )
         AND NOT EXISTS (
            SELECT 1
            FROM ChecklistItem ci
            WHERE ci.taskId = (
                SELECT taskId
                FROM ChecklistItem
                WHERE id = @id
            )
              AND ci.isCompleted = 0
        )
            THEN N'Hoàn thành'
        ELSE N'Đang thực hiện'
    END
    WHERE taskId = (
        SELECT taskId
        FROM ChecklistItem
        WHERE id = @id
    );

    INSERT INTO Activity (taskId, userId, action)
    VALUES (
        @taskId,
        @userId,
        CASE WHEN @isCompleted = 1 THEN N'Đã hoàn thành một mục checklist' ELSE N'Đã mở lại một mục checklist' END
    );

    SELECT
        id,
        taskId,
        content,
        isCompleted,
        position
    FROM ChecklistItem
    WHERE id = @id;
END
GO

-- Di chuyen checklist item (phuc vu PUT /api/checklist-items/:id/move)
CREATE OR ALTER PROCEDURE sp_ChecklistItem_Move
    @id INT,
    @position INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @taskId INT;
    DECLARE @sourcePosition INT;
    DECLARE @maxPosition INT;

    SELECT
        @taskId = ci.taskId,
        @sourcePosition = ci.position,
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM ChecklistItem ci
    INNER JOIN Task t ON t.taskId = ci.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE ci.id = @id;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy ChecklistItem', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT @maxPosition = ISNULL(MAX(position), 0)
    FROM ChecklistItem
    WHERE taskId = @taskId;

    IF @position IS NULL OR @position < 1
    BEGIN
        SET @position = 1;
    END

    IF @position > @maxPosition
    BEGIN
        SET @position = @maxPosition;
    END

    IF @position = @sourcePosition
    BEGIN
        SELECT
            id,
            taskId,
            content,
            isCompleted,
            position
        FROM ChecklistItem
        WHERE id = @id;
        RETURN;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        IF @position < @sourcePosition
        BEGIN
            UPDATE ChecklistItem
            SET position = position + 1
            WHERE taskId = @taskId
              AND id <> @id
              AND position >= @position
              AND position < @sourcePosition;
        END
        ELSE
        BEGIN
            UPDATE ChecklistItem
            SET position = position - 1
            WHERE taskId = @taskId
              AND id <> @id
              AND position <= @position
              AND position > @sourcePosition;
        END

        UPDATE ChecklistItem
        SET position = @position
        WHERE id = @id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        DECLARE @errorMessage NVARCHAR(4000);

        IF @@TRANCOUNT > 0
        BEGIN
            ROLLBACK TRANSACTION;
        END

        SELECT @errorMessage = ERROR_MESSAGE();
        RAISERROR(@errorMessage, 16, 1);
        RETURN;
    END CATCH

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã sắp xếp lại thứ tự checklist');

    SELECT
        id,
        taskId,
        content,
        isCompleted,
        position
    FROM ChecklistItem
    WHERE id = @id;
END
GO

-- Xoa checklist item (phuc vu DELETE /api/checklist-items/:id)
CREATE OR ALTER PROCEDURE sp_ChecklistItem_Delete
    @id INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @taskId INT;
    DECLARE @position INT;

    SELECT
        @taskId = ci.taskId,
        @position = ci.position,
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM ChecklistItem ci
    INNER JOIN Task t ON t.taskId = ci.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE ci.id = @id;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy ChecklistItem', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    DELETE FROM ChecklistItem
    WHERE id = @id;

    UPDATE ChecklistItem
    SET position = position - 1
    WHERE taskId = @taskId
      AND position > ISNULL(@position, 0);

    UPDATE Task
    SET status = CASE
        WHEN EXISTS (
            SELECT 1
            FROM ChecklistItem ci
            WHERE ci.taskId = @taskId
        )
         AND NOT EXISTS (
            SELECT 1
            FROM ChecklistItem ci
            WHERE ci.taskId = @taskId
              AND ci.isCompleted = 0
        )
            THEN N'Hoàn thành'
        ELSE N'Đang hoàn thành'
    END
    WHERE taskId = @taskId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã xóa một mục checklist');

    SELECT CAST(N'Đã xóa mục kiểm tra thành công.' AS NVARCHAR(255)) AS message;
END
GO

-- Lay danh sach comment theo task (phuc vu GET /api/comments?taskId=...)
CREATE OR ALTER PROCEDURE sp_Comment_GetByTask
    @taskId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT
        c.commentId,
        c.taskId,
        c.userId,
        u.fullName,
        c.content,
        c.createdAt
    FROM Comment c
    INNER JOIN [User] u ON u.userId = c.userId
    WHERE c.taskId = @taskId
    ORDER BY c.createdAt DESC, c.commentId DESC;
END
GO

-- Tao comment (phuc vu POST /api/comments)
CREATE OR ALTER PROCEDURE sp_Comment_Create
    @taskId INT,
    @content NVARCHAR(MAX),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NULLIF(LTRIM(RTRIM(@content)), N'') IS NULL
    BEGIN
        RAISERROR(N'Nội dung bình luận không được rỗng', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    INSERT INTO Comment (taskId, userId, content)
    VALUES (@taskId, @userId, LTRIM(RTRIM(@content)));

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã thêm một bình luận');

    SELECT
        c.commentId,
        c.taskId,
        c.userId,
        u.fullName,
        c.content,
        c.createdAt
    FROM Comment c
    INNER JOIN [User] u ON u.userId = c.userId
    WHERE c.commentId = SCOPE_IDENTITY();
END
GO

-- Xoa comment (phuc vu DELETE /api/comments/:commentId)
CREATE OR ALTER PROCEDURE sp_Comment_Delete
    @commentId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @taskId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Comment c
    INNER JOIN Task t ON t.taskId = c.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE c.commentId = @commentId;

    SELECT @taskId = c.taskId
    FROM Comment c
    WHERE c.commentId = @commentId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Comment', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    DELETE FROM Comment WHERE commentId = @commentId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã xóa một bình luận');

    SELECT CAST(N'Đã xóa bình luận thành công.' AS NVARCHAR(255)) AS message;
END
GO

-- Lay danh sach attachment theo task (phuc vu GET /api/attachments?taskId=...)
CREATE OR ALTER PROCEDURE sp_Attachment_GetByTask
    @taskId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT
        attachmentId,
        taskId,
        fileName,
        fileUrl,
        createdAt
    FROM Attachment
    WHERE taskId = @taskId
    ORDER BY createdAt DESC, attachmentId DESC;
END
GO

-- Tao attachment (phuc vu POST /api/attachments)
CREATE OR ALTER PROCEDURE sp_Attachment_Create
    @taskId INT,
    @fileName NVARCHAR(255) = NULL,
    @fileUrl NVARCHAR(500),
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @resolvedFileName NVARCHAR(255);

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NULLIF(LTRIM(RTRIM(@fileUrl)), N'') IS NULL
    BEGIN
        RAISERROR(N'File URL không được rỗng', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SET @resolvedFileName = NULLIF(LTRIM(RTRIM(@fileName)), N'');

    IF @resolvedFileName IS NULL
    BEGIN
        SET @resolvedFileName = RIGHT(@fileUrl, CHARINDEX('/', REVERSE(@fileUrl) + '/') - 1);
    END

    IF NULLIF(LTRIM(RTRIM(@resolvedFileName)), N'') IS NULL
    BEGIN
        SET @resolvedFileName = N'attachment';
    END

    INSERT INTO Attachment (taskId, fileName, fileUrl)
    VALUES (@taskId, @resolvedFileName, LTRIM(RTRIM(@fileUrl)));

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã thêm một tệp đính kèm');

    SELECT
        attachmentId,
        taskId,
        fileName,
        fileUrl,
        createdAt
    FROM Attachment
    WHERE attachmentId = SCOPE_IDENTITY();
END
GO

-- Xoa attachment (phuc vu DELETE /api/attachments/:attachmentId)
CREATE OR ALTER PROCEDURE sp_Attachment_Delete
    @attachmentId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @taskId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Attachment a
    INNER JOIN Task t ON t.taskId = a.taskId
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE a.attachmentId = @attachmentId;

    SELECT @taskId = a.taskId
    FROM Attachment a
    WHERE a.attachmentId = @attachmentId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Attachment', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    DELETE FROM Attachment WHERE attachmentId = @attachmentId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (@taskId, @userId, N'Đã xóa một tệp đính kèm');

    SELECT CAST(N'Đã xóa tệp đính kèm thành công.' AS NVARCHAR(255)) AS message;
END
GO

-- Lay danh sach activity theo task (phuc vu GET /api/activity?taskId=...)
CREATE OR ALTER PROCEDURE sp_Activity_GetByTask
    @taskId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT
        ac.activityId,
        ac.taskId,
        ac.userId,
        u.fullName,
        ac.action,
        ac.createdAt
    FROM Activity ac
    INNER JOIN [User] u ON u.userId = ac.userId
    WHERE ac.taskId = @taskId
    ORDER BY ac.createdAt DESC, ac.activityId DESC;
END
GO

-- Lay danh sach assignee theo task (phuc vu GET /api/task-assignees?taskId=...)
CREATE OR ALTER PROCEDURE sp_TaskAssignee_GetByTask
    @taskId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR wm.userId = @userId
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT
        ta.id,
        ta.taskId,
        ta.userId,
        u.fullName,
        ta.assignedAt
    FROM TaskAssignee ta
    INNER JOIN [User] u ON u.userId = ta.userId
    WHERE ta.taskId = @taskId
    ORDER BY ta.id ASC;
END
GO

-- Them assignee vao task (phuc vu POST /api/task-assignees)
CREATE OR ALTER PROCEDURE sp_TaskAssignee_Add
    @taskId INT,
    @assigneeUserId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @assigneeFullName NVARCHAR(255);

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
                    AND (
                                w.ownerId = @userId
                         OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                         OR EXISTS (
                                        SELECT 1
                                        FROM ProjectMember pm
                                        WHERE pm.projectId = @projectId
                                            AND pm.userId = @userId
                                            AND ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
                         )
                    )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM [User] u
        WHERE u.userId = @assigneeUserId
    )
    BEGIN
        RAISERROR(N'Không tìm thấy User được gán', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @assigneeUserId
        LEFT JOIN ProjectMember pm
            ON pm.projectId = @projectId
           AND pm.userId = @assigneeUserId
        WHERE w.workspaceId = @workspaceId
          AND (
                w.ownerId = @assigneeUserId
             OR wm.userId = @assigneeUserId
             OR pm.userId = @assigneeUserId
          )
    )
    BEGIN
        RAISERROR(N'User được gán không thuộc Workspace', 16, 1);
        RETURN;
    END

    IF EXISTS (
        SELECT 1
        FROM TaskAssignee
        WHERE taskId = @taskId
          AND userId = @assigneeUserId
    )
    BEGIN
        RAISERROR(N'User đã được gán vào Task', 16, 1);
        RETURN;
    END

    INSERT INTO TaskAssignee (taskId, userId)
    VALUES (@taskId, @assigneeUserId);

    SELECT @assigneeFullName = u.fullName
    FROM [User] u
    WHERE u.userId = @assigneeUserId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (
        @taskId,
        @userId,
        N'Đã giao việc cho ' + ISNULL(@assigneeFullName, N'thành viên')
    );

    SELECT
        ta.id,
        ta.taskId,
        ta.userId,
        u.fullName,
        ta.assignedAt
    FROM TaskAssignee ta
    INNER JOIN [User] u ON u.userId = ta.userId
    WHERE ta.id = SCOPE_IDENTITY();
END
GO

-- Xoa assignee khoi task (phuc vu DELETE /api/task-assignees)
CREATE OR ALTER PROCEDURE sp_TaskAssignee_Remove
    @taskId INT,
    @assigneeUserId INT,
    @userId INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @workspaceId INT;
    DECLARE @projectId INT;
    DECLARE @assigneeFullName NVARCHAR(255);

    SELECT
        @workspaceId = p.workspaceId,
        @projectId = p.projectId
    FROM Task t
    INNER JOIN [List] l ON l.listId = t.listId
    INNER JOIN Board b ON b.boardId = l.boardId
    INNER JOIN Project p ON p.projectId = b.projectId
    WHERE t.taskId = @taskId;

    IF @workspaceId IS NULL
    BEGIN
        RAISERROR(N'Không tìm thấy Task', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM Workspace w
        LEFT JOIN WorkspaceMember wm
            ON wm.workspaceId = w.workspaceId
           AND wm.userId = @userId
        WHERE w.workspaceId = @workspaceId
          AND (
                w.ownerId = @userId
             OR ISNULL(wm.role, N'') IN (N'Owner', N'Admin')
                 OR EXISTS (
                          SELECT 1
                          FROM ProjectMember pm
                          WHERE pm.projectId = @projectId
                             AND pm.userId = @userId
                             AND ISNULL(pm.role, N'') IN (N'Owner', N'Admin')
                 )
             OR @userId = @assigneeUserId
          )
    )
    BEGIN
        RAISERROR(N'Không có quyền', 16, 1);
        RETURN;
    END

    SELECT @assigneeFullName = u.fullName
    FROM [User] u
    WHERE u.userId = @assigneeUserId;

    DELETE FROM TaskAssignee
    WHERE taskId = @taskId
      AND userId = @assigneeUserId;

    INSERT INTO Activity (taskId, userId, action)
    VALUES (
        @taskId,
        @userId,
        N'Đã bỏ giao việc cho ' + ISNULL(@assigneeFullName, N'thành viên')
    );

    SELECT CAST(N'Đã xóa người được giao thành công.' AS NVARCHAR(255)) AS message;
END
GO


