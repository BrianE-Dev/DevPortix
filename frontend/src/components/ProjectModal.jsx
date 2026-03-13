import { X, Plus } from 'lucide-react';

const ProjectModal = ({
  isOpen,
  projectId,
  formData,
  setFormData,
  onClose,
  onSave,
  onError,
}) => {
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleAddTechnology = (tech) => {
    const value = tech.trim();
    if (!value) return;

    setFormData((prev) => {
      if (prev.technologies.includes(value)) return prev;
      return {
        ...prev,
        technologies: [...prev.technologies, value],
      };
    });
  };

  const handleRemoveTechnology = (tech) => {
    setFormData((prev) => ({
      ...prev,
      technologies: prev.technologies.filter((t) => t !== tech),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await onSave(formData, projectId);
    } catch (error) {
      if (error?.code === 'PLAN_LIMIT_EXCEEDED') {
        onError?.(error.message);
        return;
      }

      onError?.('Unable to save project right now. Please try again.');
      return;
    }

  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen px-4 pt-4 pb-20 sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl dark:bg-gray-800">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {projectId ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button onClick={onClose}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="Project title"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Project description"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />

              {/* Technologies */}
              <div>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Add technology"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTechnology(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 border rounded-l-lg dark:bg-gray-700"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      const input = e.currentTarget.previousSibling;
                      handleAddTechnology(input.value);
                      input.value = '';
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-lg"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.technologies.map((tech, index) => (
                    <span
                      key={`${tech}-${index}`}
                      className="flex items-center px-3 py-1 text-sm bg-blue-100 rounded-full"
                    >
                      {tech}
                      <button
                        type="button"
                        onClick={() => handleRemoveTechnology(tech)}
                        className="ml-2"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <input
                type="url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleChange}
                placeholder="GitHub repo URL"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />

              <input
                type="url"
                name="liveUrl"
                value={formData.liveUrl}
                onChange={handleChange}
                placeholder="Live demo URL"
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                />
                Featured project
              </label>

              {/* Footer */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {projectId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectModal;
