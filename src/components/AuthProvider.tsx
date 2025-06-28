import React, { memo } from 'react';
import { AuthContext, useAuthProvider } from '../hooks/useAuth';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = memo(({ children }) => {
  const auth = useAuthProvider();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}, (prevProps, nextProps) => {
  // Only re-render if children reference changes
  return prevProps.children === nextProps.children;
});

AuthProvider.displayName = 'AuthProvider';