import { Outlet, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';

const StudentLayout = () => {
  const { loading, isAuthenticated, user, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== ROLES.STUDENT) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <nav className="bg-white border-b border-blue-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/student" className="text-xl font-bold text-blue-600">
                DEVPORTIX Student
              </Link>
              <div className="flex space-x-4">
                <Link to="/student" className="text-blue-600 hover:text-blue-800">
                  Dashboard
                </Link>
                <span className="text-gray-400">Portfolio (Coming Soon)</span>
                <span className="text-gray-400">Projects (Coming Soon)</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
};

export default StudentLayout;
