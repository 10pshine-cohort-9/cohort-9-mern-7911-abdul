import { useState, useEffect } from 'react';
import { api, type UserResponse } from './utils/api';
import { ToastProvider, useToast } from './components/Toast';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function MainApp() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const checkSession = async () => {
      const token = api.getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const res = await api.getMe();
        if (res.success && res.user) {
          setUser(res.user);
        } else {
          api.removeToken();
        }
      } catch {
        api.removeToken();
      } finally {
        setIsInitializing(false);
      }
    };

    checkSession();
  }, [showToast]);

  const handleAuthSuccess = (userData: UserResponse) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)' }}>
        <div style={{ fontSize: '18px', fontWeight: '500', color: 'var(--text-muted)' }}>Loading...</div>
      </div>
    );
  }

  return (
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Auth onAuthSuccess={handleAuthSuccess} />
      )}
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}

export default App;
