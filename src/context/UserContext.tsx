import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';

export function UserProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useUser() {
  const { user, updateProfile, logout } = useAuth();
  return {
    user: {
      name: user?.name || '',
      phoneNumber: user?.phone || '',
      email: user?.email || '',
      accessibilityType: 'none' as const,
      isLoggedIn: Boolean(user)
    },
    updateUser: (updates: { name?: string }) => {
      if (updates.name) void updateProfile({ name: updates.name });
    },
    logout: () => {
      void logout();
    }
  };
}
