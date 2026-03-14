import React, { useState, useEffect } from 'react';
import LocalStorageService from '../services/localStorageService';
import { ROLES } from '../utils/constants';
import { AuthContext } from './authContext';
import { authApi } from '../services/authApi';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

          LocalStorageService.setUser(normalizedUser);
          setUser(normalizedUser);
        }
      } catch {
        LocalStorageService.clearUser();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const getDashboardPath = (userToResolve = user) => {
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
      const normalizedUser = response.user?.role
        ? response.user
        : { ...response.user, role: ROLES.STUDENT };

      LocalStorageService.setToken(response.token);
      LocalStorageService.setUser(normalizedUser);
      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);

    try {
      const response = await authApi.register(userData);
      const normalizedUser = response.user?.role
        ? response.user
        : { ...response.user, role: ROLES.STUDENT };

      LocalStorageService.setToken(response.token);
      LocalStorageService.setUser(normalizedUser);
      setUser(normalizedUser);

      return { success: true, user: normalizedUser };
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
    const updatedUser = LocalStorageService.setUser(response.user);
    setUser(updatedUser);
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
    logout,
    updateProfile,
    deleteAccount,
    getDashboardPath,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
