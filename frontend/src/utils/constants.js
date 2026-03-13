export const ROLES = {
  STUDENT: 'student',
  INSTRUCTOR: 'instructor',
  ORGANIZATION: 'organization',
  PROFESSIONAL: 'professional',
  SUPER_ADMIN: 'super_admin',
};

export const ROLE_CONFIG = {
  [ROLES.STUDENT]: {
    title: 'Student',
    description: 'Build your portfolio to showcase projects and skills',
    color: 'blue',
    path: '/student'
  },
  [ROLES.INSTRUCTOR]: {
    title: 'Instructor/Mentor',
    description: 'Guide students and review portfolios',
    color: 'green',
    path: '/instructor'
  },
  [ROLES.ORGANIZATION]: {
    title: 'Organization',
    description: 'Manage instructors and students at organizational scale',
    color: 'orange',
    path: '/professional'
  },
  [ROLES.PROFESSIONAL]: {
    title: 'Professional Engineer',
    description: 'Advanced portfolio with professional experience',
    color: 'purple',
    path: '/professional'
  },
  [ROLES.SUPER_ADMIN]: {
    title: 'Super Admin',
    description: 'Platform-level administration and user management',
    color: 'red',
    path: '/admin'
  }
};
