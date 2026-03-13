import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, Code2, ExternalLink, FolderGit2, PlusCircle, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import ReactPlayground from '../../components/ReactPlayground';
import LocalStorageService from '../../services/localStorageService';
import PortfolioBuilder from '../../components/PortfolioBuilder';
import { portfolioApi } from '../../services/portfolioApi';
import { authApi } from '../../services/authApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';
import { mentorshipApi } from '../../services/mentorshipApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
const resolveMedia = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_BASE_URL}${url}`);

const StudentDashboard = () => {
  const { loading, isAuthenticated, user, getDashboardPath, updateProfile } = useAuth();
  const displayName = user?.fullName || user?.username || 'Student';
  const [activeMenuKey, setActiveMenuKey] = useState('overview');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(() => (Array.isArray(user?.skills) ? user.skills : []));
  const [skillsBusy, setSkillsBusy] = useState(false);
  const [skillsError, setSkillsError] = useState('');
  const [editingSkill, setEditingSkill] = useState('');
  const [editingSkillValue, setEditingSkillValue] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioError, setPortfolioError] = useState('');
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [mentorAssignments, setMentorAssignments] = useState([]);
  const [mentorshipBusy, setMentorshipBusy] = useState(false);
  const [mentorshipError, setMentorshipError] = useState('');
  const activeAccent = getDashboardAccent(portfolio?.accent || 'violet');
  const hasPortfolio = Boolean(portfolio);
  const portfolioPath = hasPortfolio
    ? `/portfolio/${portfolio?.slug || portfolio?.username || ''}`
    : null;
  const menuItems = [
    { key: 'overview', label: 'Overview', icon: BookOpen, badge: 'Now' },
    { key: 'projects', label: 'My Projects', icon: FolderGit2, badge: 'Soon' },
    { key: 'mentorship', label: 'Mentorship', icon: BookOpen, badge: 'Now' },
    hasPortfolio
      ? { key: 'portfolio', label: 'My Portfolio', icon: UserCircle, badge: 'Live' }
      : { key: 'create-portfolio', label: 'Create Portfolio', icon: PlusCircle, badge: 'New' },
    ...(hasPortfolio
      ? [
          {
            key: 'portfolio-link',
            label: 'Open Public Page',
            icon: ExternalLink,
            badge: 'Link',
            href: portfolioPath,
            target: '_blank',
          },
        ]
      : []),
    { key: 'code-lab', label: 'Code Lab', icon: Code2, badge: 'Now' },
  ];
  useEffect(() => {
    const savedMenuKey = user?.dashboardMenu?.student;
    const validMenuKeys = menuItems.map((item) => item.key);
    if (savedMenuKey && validMenuKeys.includes(savedMenuKey)) {
      setActiveMenuKey((currentKey) => (currentKey === savedMenuKey ? currentKey : savedMenuKey));
    }
  }, [hasPortfolio, user?.dashboardMenu?.student]);

  useEffect(() => {
    setSkills(Array.isArray(user?.skills) ? user.skills : []);
  }, [user?.skills]);

  useEffect(() => {
    if (!user) return;
    const loadPortfolio = async () => {
      try {
        const token = LocalStorageService.getToken();
        if (!token) return;
        const response = await portfolioApi.getMine(token);
        setPortfolio(response.portfolio);
      } catch (error) {
        if (error.status !== 404) {
          setPortfolioError('Unable to load portfolio right now.');
        }
      }
    };
    loadPortfolio();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const hydrateProfileState = async () => {
      try {
        const token = LocalStorageService.getToken();
        if (!token) return;
        const response = await authApi.me(token);
        if (!isMounted) return;
        const latestSkills = Array.isArray(response?.user?.skills) ? response.user.skills : [];
        setSkills(latestSkills);
      } catch {
        // Keep existing in-memory state if refresh fails
      }
    };
    hydrateProfileState();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const loadMentorship = async () => {
      const token = LocalStorageService.getToken();
      if (!token) return;
      try {
        setMentorshipBusy(true);
        setMentorshipError('');
        const [instructorsResponse, mentorshipResponse] = await Promise.all([
          mentorshipApi.listInstructors(token),
          mentorshipApi.getMyMentorship(token),
        ]);

        const nextInstructors = Array.isArray(instructorsResponse.instructors)
          ? instructorsResponse.instructors
          : [];
        setInstructors(nextInstructors);
        setSelectedInstructor(mentorshipResponse.instructor || null);
        setSelectedInstructorId(mentorshipResponse.instructor?.id || '');
        setMentorAssignments(Array.isArray(mentorshipResponse.assignments) ? mentorshipResponse.assignments : []);
      } catch (error) {
        setMentorshipError(error?.message || 'Unable to load mentorship data right now.');
      } finally {
        setMentorshipBusy(false);
      }
    };

    loadMentorship();
  }, [user?.id]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== ROLES.STUDENT) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  const persistMenuSelection = async (key) => {
    try {
      await updateProfile({
        dashboardMenu: {
          ...(user?.dashboardMenu || {}),
          student: key,
        },
      });
    } catch {
      // Keep the current UI selection even if persistence fails
    }
  };

  const handleMenuSelect = async (key) => {
    if (key === 'create-portfolio') {
      handleCreatePortfolio();
      return;
    }
    setActiveMenuKey(key);
    await persistMenuSelection(key);
  };

  const handleCreatePortfolio = async () => {
    try {
      const token = LocalStorageService.getToken();
      const response = await portfolioApi.createMine(token);
      setPortfolio(response.portfolio);
      setActiveMenuKey('portfolio');
      await persistMenuSelection('portfolio');
      setPortfolioError('');
    } catch {
      setPortfolioError('Unable to create portfolio right now.');
    }
  };

  const handlePortfolioUpdate = async (updates) => {
    const token = LocalStorageService.getToken();
    const response = await portfolioApi.updateMine(token, updates);
    setPortfolio(response.portfolio);
    setPortfolioError('');
  };

  const handleAddSkill = async () => {
    const normalizedSkill = skillInput.trim();
    if (!normalizedSkill) return;

    const alreadyExists = skills.some((item) => item.toLowerCase() === normalizedSkill.toLowerCase());
    if (alreadyExists) {
      setSkillInput('');
      return;
    }
    const nextSkills = [...skills, normalizedSkill];
    setSkillsBusy(true);
    setSkillsError('');
    try {
      const updatedUser = await updateProfile({ skills: nextSkills });
      setSkills(Array.isArray(updatedUser?.skills) ? updatedUser.skills : nextSkills);
      setSkillInput('');
    } catch {
      setSkillsError('Unable to save skills right now.');
    } finally {
      setSkillsBusy(false);
    }
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const nextSkills = skills.filter((skill) => skill !== skillToRemove);
    setSkillsBusy(true);
    setSkillsError('');
    try {
      const updatedUser = await updateProfile({ skills: nextSkills });
      setSkills(Array.isArray(updatedUser?.skills) ? updatedUser.skills : nextSkills);
    } catch {
      setSkillsError('Unable to update skills right now.');
    } finally {
      setSkillsBusy(false);
    }
  };

  const startEditingSkill = (skill) => {
    setEditingSkill(skill);
    setEditingSkillValue(skill);
    setSkillsError('');
  };

  const cancelEditingSkill = () => {
    setEditingSkill('');
    setEditingSkillValue('');
  };

  const handleSaveEditedSkill = async () => {
    const normalizedSkill = editingSkillValue.trim();
    if (!editingSkill || !normalizedSkill) {
      setSkillsError('Skill cannot be empty.');
      return;
    }

    const nextSkills = skills.map((skill) => (skill === editingSkill ? normalizedSkill : skill));
    const dedupedSkills = [...new Set(nextSkills.map((skill) => String(skill || '').trim()).filter(Boolean))];
    setSkillsBusy(true);
    setSkillsError('');
    try {
      const updatedUser = await updateProfile({ skills: dedupedSkills });
      setSkills(Array.isArray(updatedUser?.skills) ? updatedUser.skills : dedupedSkills);
      cancelEditingSkill();
    } catch {
      setSkillsError('Unable to update skills right now.');
    } finally {
      setSkillsBusy(false);
    }
  };

  const handleSelectInstructor = async () => {
    if (!selectedInstructorId) {
      setMentorshipError('Please choose an instructor first.');
      return;
    }

    const token = LocalStorageService.getToken();
    if (!token) return;

    try {
      setMentorshipBusy(true);
      setMentorshipError('');
      const response = await mentorshipApi.selectInstructor(token, selectedInstructorId);
      setSelectedInstructor(response?.mentorship?.instructor || null);
    } catch (error) {
      setMentorshipError(error?.message || 'Unable to select instructor right now.');
    } finally {
      setMentorshipBusy(false);
    }
  };

  return (
    <DashboardShell
      role="Student"
      title="Student Dashboard"
      subtitle={`Welcome, ${displayName}. This is your personalized student workspace.`}
      accentClass={activeAccent.textClass}
      activeTabClass={activeAccent.primaryButtonClass}
      menuItems={menuItems}
      activeMenuKey={activeMenuKey}
      onMenuSelect={handleMenuSelect}
    >
      {activeMenuKey === 'overview' && (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-white">Portfolio Status</h3>
              <p className="text-gray-300 mb-4">Your portfolio is ready to be built</p>
              <div className={`text-sm ${activeAccent.textClass}`}>0% complete</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-white">Projects</h3>
              <p className="text-gray-300 mb-4">Showcase your coding projects</p>
              <div className={`text-sm ${activeAccent.textClass}`}>Coming Soon</div>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2 text-white">Skills</h3>
              <p className="text-gray-300 mb-4">Add and save the skills you want to showcase.</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill (e.g. React)"
                  className="flex-1 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  disabled={skillsBusy}
                  className={`px-3 py-2 rounded-lg text-sm text-white transition ${activeAccent.primaryButtonClass}`}
                >
                  Save
                </button>
              </div>
              {skillsError && <p className="text-xs text-red-300 mb-3">{skillsError}</p>}
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <div
                      key={skill}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white"
                    >
                      {editingSkill === skill ? (
                        <>
                          <input
                            type="text"
                            value={editingSkillValue}
                            onChange={(event) => setEditingSkillValue(event.target.value)}
                            className="w-28 rounded bg-black/20 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button type="button" onClick={handleSaveEditedSkill} disabled={skillsBusy} className="text-[10px]">
                            save
                          </button>
                          <button type="button" onClick={cancelEditingSkill} disabled={skillsBusy} className="text-[10px] text-red-300 hover:text-red-200">
                            cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => startEditingSkill(skill)}
                            disabled={skillsBusy}
                            className="text-[10px]"
                          >
                            edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            disabled={skillsBusy}
                            className="text-[10px] text-red-300 hover:text-red-200"
                          >
                            x
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`text-sm ${activeAccent.textClass}`}>No skills saved yet.</div>
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-lg mb-2 text-white">My Instructor</h3>
            {selectedInstructor ? (
              <p className="text-gray-300">
                {selectedInstructor.fullName} ({selectedInstructor.email})
              </p>
            ) : (
              <p className="text-gray-400">No instructor selected yet.</p>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 mb-8">
            <h3 className="font-semibold text-lg mb-4 text-white">Getting Started</h3>
            <ul className="space-y-3 text-gray-300">
              <li>1. Complete your profile information.</li>
              <li>2. Add your first project to showcase.</li>
              <li>3. Connect with instructors for feedback.</li>
            </ul>
          </div>
        </>
      )}

      {activeMenuKey === 'projects' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-2">My Projects</h3>
          <p className="text-gray-300">Project management tools are coming soon. Use Code Lab to prototype components now.</p>
        </div>
      )}

      {activeMenuKey === 'mentorship' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Choose Instructor</h3>
            <p className="text-gray-300 mb-4">
              Select an instructor. You will be added automatically to that instructor&apos;s dashboard.
            </p>

            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              <select
                value={selectedInstructorId}
                onChange={(event) => setSelectedInstructorId(event.target.value)}
                className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select an instructor</option>
                {instructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.fullName} ({instructor.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSelectInstructor}
                disabled={mentorshipBusy}
                className={`px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
              >
                {mentorshipBusy ? 'Saving...' : 'Select Instructor'}
              </button>
            </div>
            {mentorshipError && <p className="text-sm text-red-300 mt-3">{mentorshipError}</p>}
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Assignments & Scores</h3>
            {(mentorAssignments || []).length === 0 ? (
              <p className="text-gray-300">No assignments yet. Your instructor assignments will appear here.</p>
            ) : (
              <div className="space-y-3">
                {mentorAssignments.map((assignment) => (
                  <div key={assignment.id} className="border border-white/10 rounded-lg p-4 bg-black/10">
                    <p className="text-white font-semibold">{assignment.title}</p>
                    <p className="text-sm text-gray-300 mt-1">{assignment.question}</p>
                    {assignment.details && <p className="text-sm text-gray-400 mt-1">{assignment.details}</p>}
                    {assignment.attachment?.url && (
                      <a
                        href={resolveMedia(assignment.attachment.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-300 hover:text-blue-200 mt-2 inline-block"
                      >
                        Open attachment ({assignment.attachment.originalName || 'file'})
                      </a>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Score: {Number.isFinite(assignment.score) ? assignment.score : 'Not scored'} | Due:{' '}
                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeMenuKey === 'create-portfolio' && !hasPortfolio && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-2">Create Portfolio</h3>
          <p className="text-gray-300">
            Generate your portfolio page to start customizing it.
          </p>
          <button
            type="button"
            onClick={handleCreatePortfolio}
            className={`mt-4 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
          >
            Create Portfolio
          </button>
          {portfolioError && <p className="text-sm text-red-300 mt-3">{portfolioError}</p>}
        </div>
      )}

      {activeMenuKey === 'portfolio' && hasPortfolio && (
        <PortfolioBuilder
          portfolio={portfolio}
          onUpdate={handlePortfolioUpdate}
          accentClass={activeAccent.textClass}
        />
      )}

      {activeMenuKey === 'code-lab' && (
        <div>
          <ReactPlayground storageKey="student-dashboard-react-playground" title="Student React Playground" />
        </div>
      )}
    </DashboardShell>
  );
};

export default StudentDashboard;
