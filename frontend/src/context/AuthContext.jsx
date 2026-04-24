import React, { useCallback, useState, useEffect } from 'react';
import LocalStorageService from '../services/localStorageService';
import { ROLES } from '../utils/constants';
import { AuthContext } from './authContext';
import { authApi } from '../services/authApi';
import { getRecommendedPlanForRole, requiresPlanPurchase } from '../utils/accessControl';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthenticatedUser = useCallback((nextUser) => {
    const normalizedUser = nextUser?.role
      ? nextUser
      : { ...nextUser, role: ROLES.STUDENT };

    LocalStorageService.setUser(normalizedUser);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const token = LocalStorageService.getToken();
        const storedUser = LocalStorageService.getUser();

        if (token && storedUser) {
          const response = await authApi.me(token);
          const normalizedUser = response.user?.role
            ? response.user
            : { ...response.user, role: ROLES.STUDENT };

          setAuthenticatedUser(normalizedUser);
        }
      } catch {
        LocalStorageService.clearUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, [setAuthenticatedUser]);

  const getDashboardPath = (userToResolve = user) => {
    if (requiresPlanPurchase(userToResolve)) {
      const recommendedPlan = getRecommendedPlanForRole(userToResolve?.role);
      return `/pricing?required=1&plan=${encodeURIComponent(recommendedPlan)}`;
    }

    const role = userToResolve?.role;
    if (role === ROLES.SUPER_ADMIN) return '/admin';
    if (role === ROLES.INSTRUCTOR) return '/instructor';
    if (role === ROLES.ORGANIZATION) return '/professional';
    if (role === ROLES.PROFESSIONAL) return '/professional';
    return '/student';
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      if (response?.requiresTotp) {
        return {
          success: false,
          requiresTotp: true,
          loginChallengeToken: response.loginChallengeToken,
        };
      }

      LocalStorageService.setToken(response.token);
      const normalizedUser = setAuthenticatedUser(response.user);

      return { success: true, user: normalizedUser };
    } finally {
      setLoading(false);
    }
  };

  const verifyLoginTotp = async (loginChallengeToken, code) => {
    setLoading(true);
    try {
      const response = await authApi.verifyLoginTotp({ loginChallengeToken, code });
      LocalStorageService.setToken(response.token);
      const normalizedUser = setAuthenticatedUser(response.user);

      return { success: true, user: normalizedUser };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);

    try {
      const response = await authApi.register(userData);
      return { success: true, ...response };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    LocalStorageService.clearUser();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return null;

    const token = LocalStorageService.getToken();
    if (!token) return null;

    const response = await authApi.updateProfile(token, updates);
    const updatedUser = setAuthenticatedUser(response.user);
    return updatedUser;
  };

  const deleteAccount = async () => {
    const token = LocalStorageService.getToken();
    if (!token) return;
    await authApi.deleteAccount(token);
    LocalStorageService.clearUser();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    verifyLoginTotp,
    logout,
    updateProfile,
    deleteAccount,
    getDashboardPath,
    setAuthenticatedUser,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
