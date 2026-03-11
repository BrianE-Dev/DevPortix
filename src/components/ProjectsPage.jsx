import { useEffect, useMemo, useState } from 'react';
import ProjectModal from './ProjectModal';
import LocalStorageService from '../services/localStorageService';
import { useAuth } from '../hooks/useAuth';
import { projectApi } from '../services/projectApi';

const EMPTY_FORM = {
  title: '',
  description: '',
  technologies: [],
  githubUrl: '',
  liveUrl: '',
  featured: false,
};

const ProjectsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const projectLimitInfo = useMemo(() => {
    const limit = LocalStorageService.getProjectLimitForSubscription(user?.subscription);
    return {
      limit,
      current: projects.length,
      allowed: projects.length < limit,
    };
  }, [projects.length, user?.subscription]);
  const isCreateBlocked = !projectLimitInfo.allowed;

  useEffect(() => {
    const loadProjects = async () => {
      if (!isAuthenticated) return;
      try {
        setIsLoading(true);
        const token = LocalStorageService.getToken();
        const response = await projectApi.list(token);
        setProjects(response.projects || []);
      } catch (_error) {
        setError('Unable to load projects right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, [isAuthenticated]);

  const openCreateModal = () => {
    if (isCreateBlocked) {
      setError(
        `You reached your ${user?.subscription || 'free'} plan limit (${projectLimitInfo.limit} projects). Upgrade to add more projects.`
      );
      return;
    }

    setError('');
    setActiveProjectId(null);
    setFormData(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (projectId) => {
    const project = projects.find((item) => item.id === projectId);
    setActiveProjectId(projectId);
    setFormData({
      title: project?.title || '',
      description: project?.description || '',
      technologies: project?.technologies || [],
      githubUrl: project?.githubUrl || '',
      liveUrl: project?.liveUrl || '',
      featured: Boolean(project?.featured),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setActiveProjectId(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async (payload, projectId) => {
    try {
      const token = LocalStorageService.getToken();
      if (projectId) {
        const response = await projectApi.update(token, projectId, payload);
        setProjects((prev) => prev.map((project) => (project.id === projectId ? response.project : project)));
      } else {
        const response = await projectApi.create(token, payload);
        setProjects((prev) => [response.project, ...prev]);
      }
      setError('');
      closeModal();
    } catch (saveError) {
      if (saveError?.status === 403) {
        setError(saveError.message);
        return;
      }
      setError('Unable to save project right now. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Projects</h2>
        <button
          onClick={openCreateModal}
          disabled={isCreateBlocked}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Project
        </button>
      </div>

      {error && (
        <div className="p-3 text-sm border border-red-300 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500">
        Plan usage: {projectLimitInfo.current}
        {Number.isFinite(projectLimitInfo.limit) ? ` / ${projectLimitInfo.limit}` : ' / unlimited'} projects
      </p>

      {/* Projects List */}
      <ul className="space-y-4">
        {isLoading && <li className="text-sm text-gray-500">Loading projects...</li>}
        {projects.map((project) => (
          <li
            key={project.id}
            className="p-4 border rounded-lg flex justify-between"
          >
            <div>
              <h3 className="font-medium">{project.title}</h3>
              <p className="text-sm text-gray-500">
                {project.description}
              </p>
            </div>

            <button
              onClick={() => openEditModal(project.id)}
              className="px-3 py-1 text-sm bg-gray-200 rounded-lg"
            >
              Edit
            </button>
          </li>
        ))}
      </ul>

      <ProjectModal
        isOpen={isModalOpen}
        projectId={activeProjectId}
        formData={formData}
        setFormData={setFormData}
        onClose={closeModal}
        onSave={handleSave}
        onError={setError}
      />
    </div>
  );
};

export default ProjectsPage;
