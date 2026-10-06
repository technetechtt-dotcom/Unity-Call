import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
interface UserProfile {
  name: string;
  phoneNumber: string;
  email: string;
  accessibilityType: 'none' | 'blind' | 'deaf' | 'hoh';
  isLoggedIn: boolean;
}
interface UserContextType {
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}
const defaultUser: UserProfile = {
  name: '',
  phoneNumber: '',
  email: '',
  accessibilityType: 'none',
  isLoggedIn: false
};
const UserContext = createContext<UserContextType | undefined>(undefined);
export function UserProvider({ children }: {children: ReactNode;}) {
  const [user, setUser] = useLocalStorage<UserProfile>(
    'unitycall_user',
    defaultUser
  );
  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => ({
      ...prev,
      ...updates
    }));
  };
  const logout = () => {
    setUser(defaultUser);
  };
  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
        logout
      }}>
      
      {children}
    </UserContext.Provider>);

}
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}