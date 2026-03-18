import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import LocalStorageService from '../../services/localStorageService';
import { adminApi } from '../../services/adminApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';

const ROLE_OPTIONS = [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ORGANIZATION, ROLES.PROFESSIONAL, ROLES.SUPER_ADMIN];

const SuperAdminDashboard = () => {
  const { loading, isAuthenticated, user, getDashboardPath } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState('');
  const [accentKey, setAccentKey] = useState(() => LocalStorageService.getDashboardAccent(user?.id));
  const activeAccent = getDashboardAccent(accentKey);

  const menuItems = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: ShieldCheck, badge: 'Now' },
      { key: 'users', label: 'Users', icon: Users, badge: 'Now' },
    ],
    []
  );

  const loadUsers = async () => {
    try {
      const token = LocalStorageService.getToken();
      if (!token) return;
      const response = await adminApi.listUsers(token);
      setUsers(response.users || []);
      setError('');
    } catch {
      setError('Unable to load users right now.');
    }
  };

  useEffect(() => {
    if (!user || user.role !== ROLES.SUPER_ADMIN) return;
    loadUsers();
  }, [user]);

  useEffect(() => {
    const handleAccentChanged = (event) => {
      setAccentKey(event?.detail?.accent || LocalStorageService.getDashboardAccent(user?.id));
    };

    window.addEventListener('devportix:accent-changed', handleAccentChanged);
    return () => {
      window.removeEventListener('devportix:accent-changed', handleAccentChanged);
    };
  }, [user?.id]);

  const handleRoleChange = async (targetUserId, nextRole) => {
    try {
      setBusyUserId(targetUserId);
      const token = LocalStorageService.getToken();
      if (!token) return;
      await adminApi.updateUserRole(token, targetUserId, nextRole);
      await loadUsers();
    } catch {
      setError('Unable to update role right now.');
    } finally {
      setBusyUserId('');
    }
  };

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== ROLES.SUPER_ADMIN) return <Navigate to={getDashboardPath()} replace />;

  return (
    <DashboardShell
      role="Super Admin"
      title="Super Admin Dashboard"
      subtitle="Manage platform users and privileged roles."
      accentClass={activeAccent.textClass}
      activeTabClass={activeAccent.primaryButtonClass}
      menuItems={menuItems}
      activeMenuKey="users"
      onMenuSelect={() => {}}
    >
      <div className="dashboard-panel rounded-[1.5rem] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">User Role Management</h3>
          <button
            type="button"
            onClick={loadUsers}
            className="dashboard-soft-button px-3 py-2 rounded-xl text-white"
          >
            Refresh
          </button>
        </div>

        {error && <p className="text-sm text-red-300 mb-4">{error}</p>}

        <div className="overflow-x-auto">
          <table className="dashboard-table w-full text-sm">
            <thead>
              <tr className="text-left border-b border-white/10">
                <th className="py-3 pr-4 text-gray-300 font-medium">Name</th>
                <th className="py-3 pr-4 text-gray-300 font-medium">Email</th>
                <th className="py-3 pr-4 text-gray-300 font-medium">Current Role</th>
                <th className="py-3 text-gray-300 font-medium">Set Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((userItem) => (
                <tr key={userItem.id} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-white">{userItem.fullName || 'User'}</td>
                  <td className="py-3 pr-4 text-gray-300">{userItem.email}</td>
                  <td className="py-3 pr-4 text-gray-300">{userItem.role}</td>
                  <td className="py-3">
                    <select
                      value={userItem.role}
                      disabled={busyUserId === userItem.id}
                      onChange={(event) => handleRoleChange(userItem.id, event.target.value)}
                      className="dashboard-input px-3 py-2 rounded-xl text-white disabled:opacity-60"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-gray-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
