import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import LocalStorageService from '../../services/localStorageService';
import { adminApi } from '../../services/adminApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';

const ROLE_OPTIONS = [ROLES.STUDENT, ROLES.INSTRUCTOR, ROLES.ORGANIZATION, ROLES.PROFESSIONAL, ROLES.SUPER_ADMIN];

const METRIC_CARDS = [
  { key: 'total', label: 'Total users', role: null },
  { key: ROLES.STUDENT, label: 'Students', role: ROLES.STUDENT },
  { key: ROLES.INSTRUCTOR, label: 'Instructors', role: ROLES.INSTRUCTOR },
  { key: ROLES.ORGANIZATION, label: 'Organizations', role: ROLES.ORGANIZATION },
  { key: ROLES.PROFESSIONAL, label: 'Professionals', role: ROLES.PROFESSIONAL },
  { key: ROLES.SUPER_ADMIN, label: 'Super admins', role: ROLES.SUPER_ADMIN },
];

const roleLabel = (role) =>
  String(role || '')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const SuperAdminDashboard = () => {
  const { loading, isAuthenticated, user, getDashboardPath } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState('');
  const [activeMenuKey, setActiveMenuKey] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [accentKey, setAccentKey] = useState(() => LocalStorageService.getDashboardAccent(user?.id));
  const activeAccent = getDashboardAccent(accentKey);

  const menuItems = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: BarChart3, badge: 'Insights' },
      { key: 'users', label: 'Users', icon: Users, badge: 'Manage' },
      { key: 'roles', label: 'Roles', icon: ShieldCheck, badge: 'Control' },
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

  const metrics = useMemo(() => {
    const counts = {
      total: users.length,
      [ROLES.STUDENT]: 0,
      [ROLES.INSTRUCTOR]: 0,
      [ROLES.ORGANIZATION]: 0,
      [ROLES.PROFESSIONAL]: 0,
      [ROLES.SUPER_ADMIN]: 0,
    };

    users.forEach((userItem) => {
      const role = String(userItem.role || '').trim().toLowerCase();
      if (counts[role] !== undefined) {
        counts[role] += 1;
      }
    });

    return counts;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return users.filter((userItem) => {
      const matchesRole = roleFilter === 'all' || userItem.role === roleFilter;
      if (!matchesRole) return false;
      if (!normalizedQuery) return true;

      const haystack = [userItem.fullName, userItem.email, userItem.role, userItem.githubUsername]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [roleFilter, searchTerm, users]);

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
      subtitle="Track platform-wide role distribution and manage privileged access from one place."
      accentClass={activeAccent.textClass}
      activeTabClass={activeAccent.primaryButtonClass}
      menuItems={menuItems}
      activeMenuKey={activeMenuKey}
      onMenuSelect={setActiveMenuKey}
    >
      <div className="space-y-6">
        {error && <p className="text-sm text-red-300">{error}</p>}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {METRIC_CARDS.map((card) => (
            <div key={card.key} className="dashboard-panel rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.28em] text-gray-400">{card.label}</p>
              <p className="mt-4 text-3xl font-semibold text-white">
                {card.role ? metrics[card.role] : metrics.total}
              </p>
              <p className="mt-2 text-sm text-gray-400">
                {card.role ? `${roleLabel(card.role)} accounts currently active in the workspace.` : 'All registered accounts across the platform.'}
              </p>
            </div>
          ))}
        </section>

        {activeMenuKey === 'overview' ? (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
            <div className="dashboard-panel rounded-[1.5rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">Role Distribution</h3>
                  <p className="mt-1 text-sm text-gray-400">A quick breakdown of how accounts are spread across the platform.</p>
                </div>
                <button
                  type="button"
                  onClick={loadUsers}
                  className="dashboard-soft-button rounded-xl px-3 py-2 text-white"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {ROLE_OPTIONS.map((role) => {
                  const count = metrics[role];
                  const width = metrics.total > 0 ? `${Math.max((count / metrics.total) * 100, count > 0 ? 8 : 0)}%` : '0%';

                  return (
                    <div key={role}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-white">{roleLabel(role)}</span>
                        <span className="text-sm text-gray-300">{count}</span>
                      </div>
                      <div className="h-3 rounded-full bg-white/10">
                        <div
                          className={`h-3 rounded-full ${activeAccent.primaryButtonClass}`}
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="dashboard-panel rounded-[1.5rem] p-6">
              <h3 className="text-xl font-semibold text-white">Quick Notes</h3>
              <div className="mt-5 space-y-4 text-sm text-gray-300">
                <p>Search and role filters are available in the Users view for faster access reviews.</p>
                <p>Only super admins can enter the admin workspace or manage blog publishing rights.</p>
                <p>Role changes apply immediately after a refresh and affect guarded routes across the app.</p>
              </div>
            </div>
          </section>
        ) : null}

        {activeMenuKey === 'users' || activeMenuKey === 'roles' ? (
          <section className="dashboard-panel rounded-[1.5rem] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-white">User Role Management</h3>
                <p className="mt-1 text-sm text-gray-400">Search by name or email, then narrow the list with a role filter.</p>
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="dashboard-soft-button rounded-xl px-3 py-2 text-white"
              >
                Refresh
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by name, email, role, or GitHub username"
                className="dashboard-input rounded-xl px-4 py-3 text-white"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="dashboard-input rounded-xl px-4 py-3 text-white"
              >
                <option value="all">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <p className="mt-3 text-sm text-gray-400">
              Showing {filteredUsers.length} of {users.length} users.
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="dashboard-table w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left">
                    <th className="py-3 pr-4 font-medium text-gray-300">Name</th>
                    <th className="py-3 pr-4 font-medium text-gray-300">Email</th>
                    <th className="py-3 pr-4 font-medium text-gray-300">Role</th>
                    <th className="py-3 pr-4 font-medium text-gray-300">GitHub</th>
                    <th className="py-3 font-medium text-gray-300">Set Role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((userItem) => (
                    <tr key={userItem.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 text-white">{userItem.fullName || 'User'}</td>
                      <td className="py-3 pr-4 text-gray-300">{userItem.email}</td>
                      <td className="py-3 pr-4 text-gray-300">{roleLabel(userItem.role)}</td>
                      <td className="py-3 pr-4 text-gray-300">{userItem.githubUsername || 'N/A'}</td>
                      <td className="py-3">
                        <select
                          value={userItem.role}
                          disabled={busyUserId === userItem.id}
                          onChange={(event) => handleRoleChange(userItem.id, event.target.value)}
                          className="dashboard-input rounded-xl px-3 py-2 text-white disabled:opacity-60"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>
                              {roleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-gray-400">
                        No users match the current search and filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
