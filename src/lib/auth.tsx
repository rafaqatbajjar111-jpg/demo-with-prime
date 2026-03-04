import React, { createContext, useContext, useState, useEffect } from 'react';
import { ke } from './sdk';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  isLoadingPublicSettings: boolean;
  authError: any;
  appPublicSettings: any;
  logout: (redirect?: boolean) => void;
  navigateToLogin: () => void;
  checkAppState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState<any>(null);
  const [appPublicSettings, setAppPublicSettings] = useState<any>(null);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);
      
      // Get public settings
      try {
        const settings = await ke.entities.SiteSettings.list();
        setAppPublicSettings(settings[0] || null);
      } catch (error) {
        console.warn("Failed to load public settings:", error);
        setAppPublicSettings({});
      }
      
      const token = localStorage.getItem('base44_access_token') || localStorage.getItem('token');
      if (token) {
        try {
          await checkUserAuth();
        } catch (authErr) {
          console.error("Auth check failed in checkAppState:", authErr);
          setIsLoadingAuth(false);
          setIsAuthenticated(false);
        }
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
      }
      setIsLoadingPublicSettings(false);
    } catch (error: any) {
      console.error("App state check failed:", error);
      setAuthError({ type: "unknown", message: error.message || "Failed to load app" });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const me = await ke.auth.me();
      setUser(me);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error: any) {
      console.error("User auth check failed:", error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      
      const status = error.response?.status || error.status;
      if (status === 401 || status === 403) {
        setAuthError({ type: "auth_required", message: "Authentication required" });
        // Clear potentially invalid tokens
        localStorage.removeItem('base44_access_token');
        localStorage.removeItem('token');
      }
    }
  };

  useEffect(() => {
    checkAppState();
  }, []);

  const logout = (redirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    ke.auth.logout(redirect ? window.location.href : undefined);
  };

  const navigateToLogin = () => {
    ke.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
