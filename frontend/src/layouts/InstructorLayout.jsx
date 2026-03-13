import { Outlet, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/constants';

const InstructorLayout = () => {
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

  if (user?.role !== ROLES.INSTRUCTOR) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <nav className="bg-white border-b border-green-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/instructor" className="text-xl font-bold text-green-600">
                DEVPORTIX Instructor
              </Link>
              <div className="flex space-x-4">
                <Link to="/instructor" className="text-green-600 hover:text-green-800">
                  Dashboard
                </Link>
                <span className="text-gray-400">Students (Coming Soon)</span>
                <span className="text-gray-400">Reviews (Coming Soon)</span>
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

export default InstructorLayout;
