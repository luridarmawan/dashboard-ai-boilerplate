import React, { createContext, useContext, useEffect, useState } from 'react';
import { useI18n } from './I18nContext';
// import SecurityManager from '@bs/frontend/utils/securityManager';

interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  description: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; message: string }>;
  register: (email: string, phone: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message: string }>;
  confirmPasswordReset: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || `http://localhost:${import.meta.env.VITE_API_PORT}/api`;

// Global CSRF state
let globalCsrfToken: string | null = null;
let globalSessionId: string | null = null;

// Function to get CSRF token
const getCSRFToken = async (): Promise<{ csrfToken: string; sessionId: string } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
      mode: 'cors',
      credentials: 'include',
    });
    const data = await response.json();

    if (data.success && data.data.csrfToken && data.data.sessionId) {
      globalCsrfToken = data.data.csrfToken;
      globalSessionId = data.data.sessionId;
      return { csrfToken: data.data.csrfToken, sessionId: data.data.sessionId };
    }
    return null;
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token');
    if (savedToken) {
      setToken(savedToken);
      verifyToken(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${tokenToVerify}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success && data.data.user) {
        setUser(data.data.user);
        setToken(tokenToVerify);

        // Aktifkan proteksi keamanan setelah token verification berhasil
        setTimeout(async () => {
          try {
            // const securityManager = SecurityManager.getInstance();
            // await securityManager.activateAllProtections();
          } catch (error) {
            console.error('Failed to activate security protections after token verification:', error);
          }
        }, 100);
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('auth_token');
        setToken(null);
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('auth_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      // Get CSRF token if not available
      if (!globalCsrfToken || !globalSessionId) {
        const tokenData = await getCSRFToken();
        if (!tokenData) {
          throw new Error('Failed to get CSRF token');
        }
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': globalCsrfToken!,
          'X-Session-ID': globalSessionId!,
        },
        body: JSON.stringify({ email, password }),
      });

      // Get CSRF token from response headers if available
      const csrfToken = response.headers.get('X-CSRF-Token');
      const sessionId = response.headers.get('X-Session-ID');

      if (csrfToken && sessionId) {
        // Add CSRF headers to subsequent requests
        const originalFetch = window.fetch;
        window.fetch = function(resource, options = {}) {
          const newOptions = {
            ...options,
            headers: {
              ...options.headers,
              'X-CSRF-Token': csrfToken,
              'X-Session-ID': sessionId,
            }
          };
          return originalFetch(resource, newOptions);
        };
      }

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('auth_token', data.data.token);

        // Aktifkan proteksi keamanan setelah login berhasil
        setTimeout(async () => {
          try {
            // const securityManager = SecurityManager.getInstance();
            // await securityManager.activateAllProtections();
          } catch (error) {
            console.error('Failed to activate security protections after login:', error);
          }
        }, 100); // Small delay to ensure token is properly set

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: t('err.networkError') };
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      // Get CSRF token if not available
      if (!globalCsrfToken || !globalSessionId) {
        const tokenData = await getCSRFToken();
        if (!tokenData) {
          throw new Error('Failed to get CSRF token');
        }
      }

      const response = await fetch(`${API_BASE_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': globalCsrfToken!,
          'X-Session-ID': globalSessionId!,
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('auth_token', data.data.token);

        // Aktifkan proteksi keamanan setelah Google login berhasil
        setTimeout(async () => {
          try {
            // const securityManager = SecurityManager.getInstance();
            // await securityManager.activateAllProtections();
          } catch (error) {
            console.error('Failed to activate security protections after Google login:', error);
          }
        }, 100);

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Google login error:', error);
      return { success: false, message: t('err.networkError') };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    phone: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      // Get CSRF token if not available
      if (!globalCsrfToken || !globalSessionId) {
        const tokenData = await getCSRFToken();
        if (!tokenData) {
          throw new Error('Failed to get CSRF token');
        }
      }

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': globalCsrfToken!,
          'X-Session-ID': globalSessionId!,
        },
        body: JSON.stringify({ email, phone, password, firstName, lastName }),
      });

      const data = await response.json();

      if (data.success) {
        setUser(data.data.user);
        setToken(data.data.token);
        localStorage.setItem('auth_token', data.data.token);

        // Aktifkan proteksi keamanan setelah registrasi berhasil
        setTimeout(async () => {
          try {
            // const securityManager = SecurityManager.getInstance();
            // await securityManager.activateAllProtections();
          } catch (error) {
            console.error('Failed to activate security protections after registration:', error);
          }
        }, 100);

        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: t('err.networkError') };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Nonaktifkan proteksi keamanan sebelum logout
    try {
      // const securityManager = SecurityManager.getInstance();
      // securityManager.deactivateAllProtections();
    } catch (error) {
      console.error('Failed to deactivate security protections during logout:', error);
    }

    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('selectedClientId');
    localStorage.removeItem('hasRestoredClientFromStorage');
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      // send async request reset password
      fetch(`${API_BASE_URL}/auth-public/reset-password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      return { success: true, message: t('err.resetEmail') };
    } catch (error) {
      console.error('Password reset request error:', error);
      // Still show success to prevent email enumeration
      return { success: true, message: t('err.resetEmail') };
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPasswordReset = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth-public/reset-password/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Failed to reset password' };
      }
    } catch (error) {
      console.error('Password reset confirm error:', error);
      return { success: false, message: 'Failed to reset password. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    loginWithGoogle,
    register,
    logout,
    requestPasswordReset,
    confirmPasswordReset,
    updateUser,
    isLoading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};