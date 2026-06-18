import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  user: any;
  isPremium: boolean;
  loginWithGoogle: () => void;
  logout: () => void;
  upgradeToPremium: () => void;
  aiUsageCount: number;
  incrementAiUsage: () => boolean;
  showPremiumModal: boolean;
  setShowPremiumModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('user') || 'null'));
  const [isPremium, setIsPremium] = useState<boolean>(localStorage.getItem('premium') === 'true');
  const [aiUsageCount, setAiUsageCount] = useState<number>(parseInt(localStorage.getItem('aiUsage') || '0'));
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const loginWithGoogle = () => {
    // Mock login
    const mockUser = {
      name: "Ahmed Ali",
      email: "ahmed@gmail.com",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d"
    };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const upgradeToPremium = () => {
    setIsPremium(true);
    localStorage.setItem('premium', 'true');
    setShowPremiumModal(false);
  };

  const incrementAiUsage = () => {
    if (isPremium) return true;
    if (aiUsageCount >= 3) {
      setShowPremiumModal(true);
      return false;
    }
    const newCount = aiUsageCount + 1;
    setAiUsageCount(newCount);
    localStorage.setItem('aiUsage', newCount.toString());
    return true;
  };

  return (
    <AuthContext.Provider value={{
      user, isPremium, loginWithGoogle, logout, upgradeToPremium,
      aiUsageCount, incrementAiUsage, showPremiumModal, setShowPremiumModal
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
