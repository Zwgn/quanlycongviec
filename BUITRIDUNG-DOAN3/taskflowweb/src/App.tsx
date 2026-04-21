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

const hasAccessToken = (): boolean => {
  const token = localStorage.getItem('taskflow_access_token');
  return Boolean(token);
};

function App() {
  const [view, setView] = useState<AppView>(hasAccessToken() ? 'dashboard' : 'landing');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(hasAccessToken);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string>('');

  const handleLogout = useCallback((nextView: AppView = 'landing') => {
    localStorage.removeItem('taskflow_access_token');
    localStorage.removeItem('taskflow_user');
    setIsAuthenticated(false);
    setSelectedProjectId(null);
    setSelectedProjectName('');
    setView(nextView);
  }, []);

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
          setSelectedProjectId(project.projectId);
          setSelectedProjectName(project.name);
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
          setSelectedProjectId(projectId);
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
          setSelectedProjectId(project.projectId);
          setSelectedProjectName(project.name);
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
