// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  BarChart3, 
  Code, 
  Users, 
  Zap,
  LayoutDashboard, 
  FolderGit, 
  Settings, 
  FileCode, 
  User,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Github,
  Eye,
  Download,
  TrendingUp,
} from 'lucide-react';
import { useModal } from '../hooks/useModal';

const mockProjects = [
  {
    id: 1,
    title: 'E-Commerce Platform',
    description: 'A full-featured online shopping platform',
    technologies: ['React', 'Node.js', 'MongoDB'],
    githubUrl: 'https://github.com/username/ecommerce',
    liveUrl: 'https://ecommerce-demo.com',
    featured: true,
  },
  {
    id: 2,
    title: 'Task Management App',
    description: 'Productivity app with real-time updates',
    technologies: ['Vue.js', 'Firebase'],
    githubUrl: 'https://github.com/username/taskapp',
    featured: false,
  },
  {
    id: 3,
    title: 'Weather Dashboard',
    description: 'Real-time weather visualization',
    technologies: ['JavaScript', 'API Integration'],
    liveUrl: 'https://weather-demo.com',
    featured: true,
  }
];

const mockAnalytics = {
  totalViews: 1234,
  uniqueVisitors: 856,
  weeklyStats: [
    { day: 'Mon', views: 150 },
    { day: 'Tue', views: 230 },
    { day: 'Wed', views: 180 },
    { day: 'Thu', views: 320 },
    { day: 'Fri', views: 280 },
    { day: 'Sat', views: 120 },
    { day: 'Sun', views: 54 },
  ]
};

const Dashboard = () => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [projects, setProjects] = useState(mockProjects);
  const [analytics] = useState(mockAnalytics);
  const { confirm, showSuccess } = useModal();
  const user = authUser;
  const welcomeName = user?.fullName || user?.username || 'User';

  const handleDeleteProject = async (projectId) => {
    const isConfirmed = await confirm({
      title: 'Delete Project?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!isConfirmed) return;

    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    showSuccess('Project Deleted', 'Project removed successfully.');
    // In your actual app, you would also update localStorage here
    // LocalStorageService.deleteProject(projectId);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'projects', label: 'Projects', icon: <FolderGit className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'portfolio', label: 'Portfolio', icon: <FileCode className="w-5 h-5" /> },
    { id: 'profile', label: 'Profile', icon: <User className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Welcome back, {welcomeName}!</h1>
          <p className="mt-2 text-gray-400">
            Manage your portfolio and projects from here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Quick Stats */}
            <div className="p-4 mt-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <h3 className="text-sm font-semibold text-white">
                Quick Stats
              </h3>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Projects</span>
                  <span className="text-sm font-medium text-white">
                    {projects.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Portfolio Views</span>
                  <span className="text-sm font-medium text-white">
                    {analytics?.totalViews || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Plan</span>
                  <span className="text-sm font-medium text-white capitalize">
                    {user?.subscription || 'free'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards - Keeping your original style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Projects</p>
                        <p className="text-2xl font-bold text-white mt-2">{projects.length}</p>
                      </div>
                      <Code className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Visitors</p>
                        <p className="text-2xl font-bold text-white mt-2">{analytics?.totalViews || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Performance</p>
                        <p className="text-2xl font-bold text-white mt-2">98%</p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>
                  
                  <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Unique Visitors</p>
                        <p className="text-2xl font-bold text-white mt-2">{analytics?.uniqueVisitors || 0}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Recent Projects */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">
                      Recent Projects
                    </h2>
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="text-sm font-medium text-blue-400 hover:text-blue-300"
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-4">
                    {projects.slice(0, 3).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-4 border border-white/10 rounded-lg">
                        <div>
                          <h3 className="font-medium text-white">
                            {project.title}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {project.technologies.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-300">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { void handleDeleteProject(project.id); }}
                            className="p-2 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <h2 className="mb-4 text-lg font-semibold text-white">
                    Quick Actions
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button
                      onClick={() => setActiveTab('projects')}
                      className="flex items-center p-4 border border-white/10 rounded-lg hover:bg-white/5"
                    >
                      <Plus className="w-5 h-5 mr-3 text-blue-400" />
                      <div className="text-left">
                        <p className="font-medium text-white">
                          Add New Project
                        </p>
                        <p className="text-sm text-gray-400">
                          Showcase your work
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab('portfolio')}
                      className="flex items-center p-4 border border-white/10 rounded-lg hover:bg-white/5"
                    >
                      <Download className="w-5 h-5 mr-3 text-green-400" />
                      <div className="text-left">
                        <p className="font-medium text-white">
                          Export Portfolio
                        </p>
                        <p className="text-sm text-gray-400">
                          Download as HTML
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'projects' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Your Projects
                  </h2>
                  <button
                    onClick={() => {
                      const newProject = {
                        id: projects.length + 1,
                        title: 'New Project',
                        description: 'Describe your project here',
                        technologies: ['React', 'Tailwind'],
                        githubUrl: '',
                        liveUrl: '',
                        featured: false,
                      };
                      setProjects([...projects, newProject]);
                    }}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </button>
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {projects.map((project) => (
                    <div key={project.id} className="p-6 border border-white/10 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {project.title}
                          </h3>
                          <p className="mt-2 text-gray-400">
                            {project.description}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            {project.technologies.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-1 text-xs font-medium text-blue-300 bg-blue-500/20 rounded-full"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                        {project.featured && (
                          <span className="px-2 py-1 text-xs font-medium text-green-300 bg-green-500/20 rounded-full">
                            Featured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center space-x-4">
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-gray-400 hover:text-white"
                            >
                              <Github className="w-4 h-4 mr-1" />
                              GitHub
                            </a>
                          )}
                          {project.liveUrl && (
                            <a
                              href={project.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-sm text-gray-400 hover:text-white"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Live Demo
                            </a>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-gray-300">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { void handleDeleteProject(project.id); }}
                            className="p-2 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && analytics && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="mb-6 text-xl font-bold text-white">
                  Analytics Dashboard
                </h2>
                
                <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2">
                  <div className="p-6 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          Total Views
                        </p>
                        <p className="mt-2 text-3xl font-bold text-white">
                          {analytics.totalViews}
                        </p>
                      </div>
                      <Eye className="w-12 h-12 text-blue-400 opacity-20" />
                    </div>
                  </div>
                  
                  <div className="p-6 border border-white/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">
                          Unique Visitors
                        </p>
                        <p className="mt-2 text-3xl font-bold text-white">
                          {analytics.uniqueVisitors}
                        </p>
                      </div>
                      <Users className="w-12 h-12 text-green-400 opacity-20" />
                    </div>
                  </div>
                </div>

                <div className="p-6 border border-white/10 rounded-lg">
                  <h3 className="mb-4 text-lg font-semibold text-white">
                    Weekly Views
                  </h3>
                  <div className="flex items-end h-48 space-x-2">
                    {analytics.weeklyStats.map((stat, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className="w-full bg-blue-500 rounded-t-lg"
                          style={{ height: `${(stat.views / 300) * 100}%` }}
                        />
                        <span className="mt-2 text-xs text-gray-400">
                          {stat.day}
                        </span>
                        <span className="text-xs font-medium text-white">
                          {stat.views}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="mb-6 text-xl font-bold text-white">
                  Portfolio Settings
                </h2>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="p-6 border border-white/10 rounded-lg">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Export Options
                    </h3>
                    <div className="space-y-4">
                      <button className="flex items-center justify-between w-full p-4 border border-white/10 rounded-lg hover:bg-white/5">
                        <div className="text-left">
                          <p className="font-medium text-white">
                            Static HTML
                          </p>
                          <p className="text-sm text-gray-400">
                            Download as HTML/CSS
                          </p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      <button className="flex items-center justify-between w-full p-4 border border-white/10 rounded-lg hover:bg-white/5">
                        <div className="text-left">
                          <p className="font-medium text-white">
                            PDF Resume
                          </p>
                          <p className="text-sm text-gray-400">
                            Generate professional resume
                          </p>
                        </div>
                        <FileCode className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 border border-white/10 rounded-lg">
                    <h3 className="mb-4 text-lg font-semibold text-white">
                      Preview & Share
                    </h3>
                    <div className="space-y-4">
                      <button className="flex items-center justify-between w-full p-4 border border-white/10 rounded-lg hover:bg-white/5">
                        <div className="text-left">
                          <p className="font-medium text-white">
                            View Portfolio
                          </p>
                          <p className="text-sm text-gray-400">
                            Preview your live portfolio
                          </p>
                        </div>
                        <Eye className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      <button className="flex items-center justify-between w-full p-4 border border-white/10 rounded-lg hover:bg-white/5">
                        <div className="text-left">
                          <p className="font-medium text-white">
                            Share Link
                          </p>
                          <p className="text-sm text-gray-400">
                            Copy portfolio URL
                          </p>
                        </div>
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && user && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="mb-6 text-xl font-bold text-white">
                  Profile Settings
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <User className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {user.fullName}
                      </h3>
                      <p className="text-gray-400">{user.email}</p>
                      <p className="text-sm text-gray-500">
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        Full Name
                      </label>
                      <input
                        type="text"
                        defaultValue={user.fullName}
                        className="w-full px-3 py-2 mt-1 border border-white/10 bg-white/5 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={user.email}
                        className="w-full px-3 py-2 mt-1 border border-white/10 bg-white/5 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        GitHub Username
                      </label>
                      <input
                        type="text"
                        defaultValue={user.githubUsername || ''}
                        className="w-full px-3 py-2 mt-1 border border-white/10 bg-white/5 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400">
                        Subscription Plan
                      </label>
                      <div className="flex items-center mt-1">
                        <span className="px-3 py-1 text-sm font-medium text-white bg-blue-500 rounded-full">
                          {user.subscription || 'free'}
                        </span>
                        <button className="ml-3 text-sm text-blue-400 hover:text-blue-300">
                          Upgrade
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button className="px-4 py-2 text-gray-300 border border-white/10 rounded-lg hover:bg-white/5">
                      Cancel
                    </button>
                    <button className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="mb-6 text-xl font-bold text-white">
                  Account Settings
                </h2>
                
                <div className="space-y-6">
                  <div className="p-4 border border-white/10 rounded-lg">
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      Theme Preferences
                    </h3>
                    <div className="flex space-x-4">
                      <button className="flex-1 p-4 border border-white/10 rounded-lg hover:border-blue-500">
                        <div className="w-full h-24 bg-gray-100 rounded mb-2"></div>
                        <p className="text-sm font-medium text-white">Light</p>
                      </button>
                      <button className="flex-1 p-4 border border-white/10 rounded-lg hover:border-blue-500">
                        <div className="w-full h-24 bg-gray-800 rounded mb-2"></div>
                        <p className="text-sm font-medium text-white">Dark</p>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 border border-white/10 rounded-lg">
                    <h3 className="mb-3 text-lg font-semibold text-white">
                      Data Management
                    </h3>
                    <div className="space-y-3">
                      <button className="flex items-center justify-between w-full p-3 text-left border border-white/10 rounded-lg hover:bg-white/5">
                        <div>
                          <p className="font-medium text-white">
                            Export All Data
                          </p>
                          <p className="text-sm text-gray-400">
                            Download your data as JSON
                          </p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      <button className="flex items-center justify-between w-full p-3 text-left text-red-400 border border-white/10 rounded-lg hover:bg-red-500/10">
                        <div>
                          <p className="font-medium">Delete Account</p>
                          <p className="text-sm">
                            Permanently delete your account and data
                          </p>
                        </div>
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
