const Project = require('../modules/project');
const Subscription = require('../modules/subscription');

const toProjectPayload = (projectDoc) => ({
  id: String(projectDoc._id),
  title: projectDoc.title,
  description: projectDoc.description,
  technologies: projectDoc.technologies || [],
  githubUrl: projectDoc.githubUrl,
  liveUrl: projectDoc.liveUrl,
  screenshots: projectDoc.screenshots || [],
  featured: Boolean(projectDoc.featured),
  createdAt: projectDoc.createdAt,
  updatedAt: projectDoc.updatedAt,
});

const getProjectLimit = async (ownerId) => {
  const subscription = await Subscription.findOne({ ownerId }).lean();
  if (!subscription) return 4;
  return Number(subscription.projectLimit || 4);
};

const listProjects = async (req, res) => {
  try {
    const projects = await Project.find({ ownerId: req.userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      projects: projects.map(toProjectPayload),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load projects', error: error.message });
  }
};

const createProject = async (req, res) => {
  try {
    const currentCount = await Project.countDocuments({ ownerId: req.userId });
    const limit = await getProjectLimit(req.userId);
    if (currentCount >= limit) {
      return res.status(403).json({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: `You have reached your plan limit (${limit} projects). Upgrade to add more projects.`,
      });
    }

    const { title, description, technologies, githubUrl, liveUrl, screenshots, featured } = req.body || {};
    if (!String(title || '').trim()) {
      return res.status(400).json({ message: 'Project title is required' });
    }

    const created = await Project.create({
      ownerId: req.userId,
      title: String(title).trim(),
      description: String(description || '').trim(),
      technologies: Array.isArray(technologies) ? technologies : [],
      githubUrl: String(githubUrl || '').trim(),
      liveUrl: String(liveUrl || '').trim(),
      screenshots: Array.isArray(screenshots) ? screenshots : [],
      featured: Boolean(featured),
    });

    return res.status(201).json({ project: toProjectPayload(created) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const { title, description, technologies, githubUrl, liveUrl, screenshots, featured } = req.body || {};

    const updates = {};
    if (title !== undefined) updates.title = String(title).trim();
    if (description !== undefined) updates.description = String(description || '').trim();
    if (technologies !== undefined) updates.technologies = Array.isArray(technologies) ? technologies : [];
    if (githubUrl !== undefined) updates.githubUrl = String(githubUrl || '').trim();
    if (liveUrl !== undefined) updates.liveUrl = String(liveUrl || '').trim();
    if (screenshots !== undefined) updates.screenshots = Array.isArray(screenshots) ? screenshots : [];
    if (featured !== undefined) updates.featured = Boolean(featured);

    const project = await Project.findOneAndUpdate(
      { _id: projectId, ownerId: req.userId },
      updates,
      { returnDocument: 'after', runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    return res.status(200).json({ project: toProjectPayload(project) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update project', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = await Project.findOneAndDelete({ _id: projectId, ownerId: req.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete project', error: error.message });
  }
};

module.exports = {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
};
