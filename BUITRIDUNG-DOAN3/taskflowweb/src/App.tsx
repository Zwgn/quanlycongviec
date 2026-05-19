import React, { useCallback, useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import KanbanBoardPage from './pages/KanbanBoardPage';
import AccountManagementPage from './pages/AccountManagementPage';
import { AUTH_EXPIRED_EVENT } from './services/dashboard.service';
import './App.css';

type AppView = 'landing' | 'login' | 'register' | 'dashboard' | 'kanban' | 'account';

const LAST_VIEW_KEY = 'taskflow_last_view';
const LAST_PROJECT_ID_KEY = 'taskflow_last_project_id';
const LAST_PROJECT_NAME_KEY = 'taskflow_last_project_name';

const hasAccessToken = (): boolean => {
  const token = localStorage.getItem('taskflow_access_token');
  return Boolean(token);
};

const getStoredProjectId = (): number | null => {
  const raw = localStorage.getItem(LAST_PROJECT_ID_KEY);
  if (!raw) {
    return null;
  }

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const getStoredProjectName = (): string => localStorage.getItem(LAST_PROJECT_NAME_KEY) ?? '';

const getInitialView = (): AppView => {
  if (!hasAccessToken()) {
    return 'landing';
  }

  const lastView = localStorage.getItem(LAST_VIEW_KEY) as AppView | null;
  if (lastView === 'kanban') {
    return getStoredProjectId() ? 'kanban' : 'dashboard';
  }

  if (lastView === 'account') {
    return 'account';
  }

  return 'dashboard';
};

function App() {
  const [view, setView] = useState<AppView>(getInitialView);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasAccessToken);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(() =>
    hasAccessToken() ? getStoredProjectId() : null
  );
  const [selectedProjectName, setSelectedProjectName] = useState<string>(() =>
    hasAccessToken() ? getStoredProjectName() : ''
  );

  const persistProjectSelection = useCallback((projectId: number, projectName?: string) => {
    setSelectedProjectId(projectId);
    localStorage.setItem(LAST_PROJECT_ID_KEY, String(projectId));

    if (projectName !== undefined) {
      setSelectedProjectName(projectName);
      localStorage.setItem(LAST_PROJECT_NAME_KEY, projectName);
    }
  }, []);

  const handleLogout = useCallback((nextView: AppView = 'landing') => {
    localStorage.removeItem('taskflow_access_token');
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem(LAST_VIEW_KEY);
    localStorage.removeItem(LAST_PROJECT_ID_KEY);
    localStorage.removeItem(LAST_PROJECT_NAME_KEY);
    setIsAuthenticated(false);
    setSelectedProjectId(null);
    setSelectedProjectName('');
    setView(nextView);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    localStorage.setItem(LAST_VIEW_KEY, view);
  }, [isAuthenticated, view]);

  useEffect(() => {
    const handleAuthExpired = () => {
      handleLogout('login');
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [handleLogout]);

  if (view === 'login') {
    return (
      <LoginPage
        onNavigateRegister={() => setView('register')}
        onNavigateLanding={() => setView('landing')}
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          setView('dashboard');
        }}
      />
    );
  }

  if (view === 'register') {
    return (
      <RegisterPage
        onNavigateLogin={() => setView('login')}
        onNavigateLanding={() => setView('landing')}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <DashboardPage
        onOpenProject={(project) => {
          persistProjectSelection(project.projectId, project.name);
          setView('kanban');
        }}
        onOpenAccountSettings={() => setView('account')}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'kanban') {
    return (
      <KanbanBoardPage
        projectId={selectedProjectId ?? 0}
        initialProjectName={selectedProjectName}
        onSwitchProject={(projectId: number) => {
          persistProjectSelection(projectId);
        }}
        onLogout={handleLogout}
        onBackToDashboard={() => {
          setView('dashboard');
        }}
        onOpenAccountSettings={() => {
          setView('account');
        }}
      />
    );
  }

  if (view === 'account') {
    return (
      <AccountManagementPage
        onBackToDashboard={() => setView('dashboard')}
        onOpenProject={(project) => {
          persistProjectSelection(project.projectId, project.name);
          setView('kanban');
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <LandingPage
      isAuthenticated={isAuthenticated}
      onOpenLogin={() => setView('login')}
      onOpenRegister={() => setView('register')}
      onOpenWorkspace={() => {
        setView('dashboard');
      }}
    />
  );
}

export default App;
