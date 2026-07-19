import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../services/api';
import { adminApi } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken, isLoaded: authLoaded, isSignedIn } = useClerkAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  const loading = !userLoaded || !authLoaded || (isSignedIn && !adminChecked);

  useEffect(() => {
    setAuthTokenGetter(() => getToken().catch(() => null));
  }, [getToken]);

  useEffect(() => {
    if (!authLoaded) return;

    if (!isSignedIn) {
      setIsAdmin(false);
      setAdminChecked(true);
      return;
    }

    setAdminChecked(false);
    adminApi
      .check()
      .then(() => setIsAdmin(true))
      .catch(() => setIsAdmin(false))
      .finally(() => setAdminChecked(true));
  }, [isSignedIn, authLoaded, user?.id]);

  return (
    <AuthContext.Provider
      value={{
        user: isSignedIn ? user : null,
        isAdmin,
        loading,
        isSignedIn: !!isSignedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
