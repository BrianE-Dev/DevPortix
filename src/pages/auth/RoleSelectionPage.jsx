import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import RoleCard from '../../components/RoleCard';
import { ROLE_CONFIG, ROLES } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';

const RoleSelectionPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();
  const { loading, isAuthenticated, user, updateProfile, getDashboardPath } = useAuth();

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    try {
      const updatedUser = await updateProfile({ role });
      const dashboardPath = getDashboardPath(updatedUser || { ...user, role });
      navigate(dashboardPath, { replace: true });
    } finally {
      setSelectedRole(null);
    }
  };

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 w-full">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Path
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select the role that best describes you. This will customize your 
          DevPort experience.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <RoleCard
          role={ROLES.STUDENT}
          title={ROLE_CONFIG[ROLES.STUDENT].title}
          description={ROLE_CONFIG[ROLES.STUDENT].description}
          color={ROLE_CONFIG[ROLES.STUDENT].color}
          onSelect={handleRoleSelect}
          isLoading={selectedRole === ROLES.STUDENT}
        />
        
        <RoleCard
          role={ROLES.INSTRUCTOR}
          title={ROLE_CONFIG[ROLES.INSTRUCTOR].title}
          description={ROLE_CONFIG[ROLES.INSTRUCTOR].description}
          color={ROLE_CONFIG[ROLES.INSTRUCTOR].color}
          onSelect={handleRoleSelect}
          isLoading={selectedRole === ROLES.INSTRUCTOR}
        />
        
        <RoleCard
          role={ROLES.ORGANIZATION}
          title={ROLE_CONFIG[ROLES.ORGANIZATION].title}
          description={ROLE_CONFIG[ROLES.ORGANIZATION].description}
          color={ROLE_CONFIG[ROLES.ORGANIZATION].color}
          onSelect={handleRoleSelect}
          isLoading={selectedRole === ROLES.ORGANIZATION}
        />
      </div>
      
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          You can change your role later from your dashboard settings.
        </p>
      </div>
    </div>
  );
};

export default RoleSelectionPage;
