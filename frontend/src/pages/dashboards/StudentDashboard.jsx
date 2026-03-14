import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, Code2, ExternalLink, FolderGit2, PlusCircle, Settings, Trophy, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import ReactPlayground from '../../components/ReactPlayground';
import LocalStorageService from '../../services/localStorageService';
import PortfolioBuilder from '../../components/PortfolioBuilder';
import QuizCenter from '../../components/QuizCenter';
import { portfolioApi } from '../../services/portfolioApi';
import { authApi } from '../../services/authApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';
import { mentorshipApi } from '../../services/mentorshipApi';
import { useModal } from '../../hooks/useModal';
import ProfileSettingsPanel from '../../components/ProfileSettingsPanel';
import SettingsPanel from '../../components/SettingsPanel';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5500';
const resolveMedia = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_BASE_URL}${url}`);
const isImageAttachment = (attachment) => {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  const fileName = String(attachment?.originalName || attachment?.url || '').toLowerCase();
  if (mimeType.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName);
};
const UPGRADE_PROMPT = 'Upgrade to a better plan to access your portfolio.';

const StudentDashboard = () => {
  const { loading, isAuthenticated, user, getDashboardPath, updateProfile } = useAuth();
  const { showSuccess, showError: showErrorModal, confirm } = useModal();
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
  const portfolioUpdateQueueRef = useRef(Promise.resolve());
  const lastPortfolioMutationAtRef = useRef(0);
  const accentIntentRef = useRef('');
  const [instructors, setInstructors] = useState([]);
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');
  const [mentorAssignments, setMentorAssignments] = useState([]);
  const [mentorshipBusy, setMentorshipBusy] = useState(false);
  const [mentorshipError, setMentorshipError] = useState('');
  const [submissionDrafts, setSubmissionDrafts] = useState({});
  const [submissionImagePreviews, setSubmissionImagePreviews] = useState({});
  const [submissionBusyAssignmentId, setSubmissionBusyAssignmentId] = useState('');
  const [submissionErrors, setSubmissionErrors] = useState({});
  const submissionImagePreviewsRef = useRef({});
  const [portfolioUpgradeRequired, setPortfolioUpgradeRequired] = useState(false);
  const [accentKey, setAccentKey] = useState(() => LocalStorageService.getDashboardAccent(user?.id));
  const activeAccent = getDashboardAccent(
    portfolio?.accent ||
    LocalStorageService.getDashboardAccentIntent(user?.id) ||
    accentKey ||
    LocalStorageService.getDashboardAccent(user?.id)
  );
  const hasPortfolio = Boolean(portfolio);
  const portfolioPath = hasPortfolio
    ? `/portfolio/${portfolio?.slug || portfolio?.username || ''}`
    : null;
  const menuItems = [
    { key: 'overview', label: 'Overview', icon: BookOpen, badge: 'Now' },
    { key: 'profile', label: 'Profile', icon: UserCircle, badge: 'Now' },
    { key: 'quiz-center', label: 'Quiz Center', icon: Trophy, badge: 'Now' },
    { key: 'projects', label: 'My Projects', icon: FolderGit2, badge: 'Soon' },
    { key: 'mentorship', label: 'Mentorship', icon: BookOpen, badge: 'Now' },
    portfolioUpgradeRequired && !hasPortfolio
      ? { key: 'portfolio-upgrade', label: 'Portfolio', icon: UserCircle, badge: 'Upgrade' }
      : hasPortfolio
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
    { key: 'settings', label: 'Settings', icon: Settings, badge: 'Now', position: 'bottom' },
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
    if (!user?.id) return;
    const loadPortfolio = async () => {
      const requestStartedAt = Date.now();
      try {
        const token = LocalStorageService.getToken();
        if (!token) return;
        const response = await portfolioApi.getMine(token);
        setPortfolioUpgradeRequired(false);
        if (requestStartedAt < lastPortfolioMutationAtRef.current) {
          return;
        }
        const serverAccent = String(response?.portfolio?.accent || '').trim().toLowerCase();
        const preferredAccent = String(
          LocalStorageService.getDashboardAccentIntent(user?.id) ||
          LocalStorageService.getDashboardAccent(user?.id) ||
          ''
        ).trim().toLowerCase();
        if (preferredAccent && serverAccent && preferredAccent !== serverAccent) {
          const syncedResponse = await portfolioApi.updateMine(token, { accent: preferredAccent });
          const syncedAccent = String(syncedResponse?.portfolio?.accent || '').trim().toLowerCase();
          if (syncedAccent === preferredAccent) {
            setPortfolio(syncedResponse.portfolio);
            LocalStorageService.setDashboardAccent(syncedResponse?.portfolio?.accent, user?.id);
            LocalStorageService.setDashboardAccentIntent('', user?.id);
          } else {
            setPortfolio({ ...syncedResponse.portfolio, accent: preferredAccent });
            LocalStorageService.setDashboardAccent(preferredAccent, user?.id);
          }
          return;
        }
        const accentIntent = String(accentIntentRef.current || '').trim().toLowerCase();
        const effectiveAccent = accentIntent || serverAccent;
        if (accentIntent && serverAccent === accentIntent) {
          accentIntentRef.current = '';
        }
        setPortfolio({ ...response.portfolio, accent: effectiveAccent || response?.portfolio?.accent });
        LocalStorageService.setDashboardAccent(effectiveAccent || response?.portfolio?.accent, user?.id);
      } catch (error) {
        if (error?.status === 403) {
          setPortfolioUpgradeRequired(true);
          setPortfolio(null);
          setPortfolioError(UPGRADE_PROMPT);
          return;
        }
        if (error?.status === 404) {
          setPortfolioUpgradeRequired(false);
          setPortfolio(null);
          return;
        }
        if (error.status !== 404) {
          setPortfolioError('Unable to load portfolio right now.');
        }
      }
    };
    loadPortfolio();
  }, [user?.id]);

  useEffect(() => {
    const handleAccentChanged = (event) => {
      setAccentKey(event?.detail?.accent || LocalStorageService.getDashboardAccent(user?.id));
    };
    window.addEventListener('devportix:accent-changed', handleAccentChanged);
    return () => window.removeEventListener('devportix:accent-changed', handleAccentChanged);
  }, [user?.id]);

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
        const nextAssignments = Array.isArray(mentorshipResponse.assignments) ? mentorshipResponse.assignments : [];
        setMentorAssignments(nextAssignments);
        setSubmissionDrafts((current) => {
          const nextDrafts = {};
          nextAssignments.forEach((assignment) => {
            const existingDraft = current[assignment.id];
            nextDrafts[assignment.id] = {
              answer: existingDraft?.answer ?? assignment?.submission?.answer ?? '',
              submissionAttachment: existingDraft?.submissionAttachment ?? null,
            };
          });
          return nextDrafts;
        });
        setSubmissionErrors((current) => {
          const nextErrors = {};
          nextAssignments.forEach((assignment) => {
            if (current[assignment.id]) {
              nextErrors[assignment.id] = current[assignment.id];
            }
          });
          return nextErrors;
        });
      } catch (error) {
        setMentorshipError(error?.message || 'Unable to load mentorship data right now.');
      } finally {
        setMentorshipBusy(false);
      }
    };

    loadMentorship();
  }, [user?.id]);

  useEffect(() => {
    submissionImagePreviewsRef.current = submissionImagePreviews;
  }, [submissionImagePreviews]);

  useEffect(() => () => {
    Object.values(submissionImagePreviewsRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  }, []);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== ROLES.STUDENT) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  const isInstructorSelectionLocked = Boolean(selectedInstructor?.id);

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
    if (key === 'portfolio-upgrade') {
      setActiveMenuKey('portfolio-upgrade');
      setPortfolioError(UPGRADE_PROMPT);
      return;
    }
    if (key === 'create-portfolio') {
      handleCreatePortfolio();
      return;
    }
    setActiveMenuKey(key);
    await persistMenuSelection(key);
  };

  const handleCreatePortfolio = async () => {
    try {
      lastPortfolioMutationAtRef.current = Date.now();
      const token = LocalStorageService.getToken();
      const response = await portfolioApi.createMine(token);
      setPortfolio(response.portfolio);
      setPortfolioUpgradeRequired(false);
      LocalStorageService.setDashboardAccent(response?.portfolio?.accent, user?.id);
      setActiveMenuKey('portfolio');
      await persistMenuSelection('portfolio');
      setPortfolioError('');
    } catch (error) {
      if (error?.status === 403) {
        setPortfolioUpgradeRequired(true);
        setPortfolioError(UPGRADE_PROMPT);
        setActiveMenuKey('portfolio-upgrade');
        return;
      }
      setPortfolioError('Unable to create portfolio right now.');
    }
  };

  const handlePortfolioUpdate = (updates) => {
    lastPortfolioMutationAtRef.current = Date.now();
    const hasAccentUpdate = updates && Object.prototype.hasOwnProperty.call(updates, 'accent');
    const requestedAccent = hasAccentUpdate ? String(updates.accent || '').trim().toLowerCase() : '';
    if (updates && Object.prototype.hasOwnProperty.call(updates, 'accent')) {
      accentIntentRef.current = requestedAccent;
      LocalStorageService.setDashboardAccentIntent(requestedAccent, user?.id);
      LocalStorageService.setDashboardAccent(requestedAccent, user?.id);
      setPortfolio((currentPortfolio) =>
        currentPortfolio ? { ...currentPortfolio, accent: requestedAccent } : currentPortfolio
      );
    }

    const nextUpdate = portfolioUpdateQueueRef.current.then(async () => {
      const token = LocalStorageService.getToken();
      let response = await portfolioApi.updateMine(token, updates);
      if (hasAccentUpdate) {
        const persistedAccent = String(response?.portfolio?.accent || '').trim().toLowerCase();
        if (requestedAccent && persistedAccent !== requestedAccent) {
          response = await portfolioApi.updateMine(token, { accent: requestedAccent });
        }
      }
      setPortfolio((currentPortfolio) => {
        if (hasAccentUpdate) {
          const persistedAccent = String(response?.portfolio?.accent || '').trim().toLowerCase();
          if (requestedAccent && persistedAccent === requestedAccent) {
            accentIntentRef.current = '';
            LocalStorageService.setDashboardAccentIntent('', user?.id);
          }
          return {
            ...response.portfolio,
            accent: requestedAccent || persistedAccent || response?.portfolio?.accent,
          };
        }
        if (!currentPortfolio) {
          return response.portfolio;
        }
        return {
          ...response.portfolio,
          accent: currentPortfolio.accent || response?.portfolio?.accent,
        };
      });
      if (hasAccentUpdate) {
        LocalStorageService.setDashboardAccent(requestedAccent || response?.portfolio?.accent, user?.id);
      }
      setPortfolioError('');
      return response.portfolio;
    });

    portfolioUpdateQueueRef.current = nextUpdate.catch(() => undefined);
    return nextUpdate;
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
      showSuccess('Profile Updated', 'Your skills were updated successfully.');
    } catch {
      setSkillsError('Unable to save skills right now.');
      showErrorModal('Update Failed', 'Unable to save skills right now.');
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
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Skill?',
      message: 'Are you sure you want to delete this skill?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    const nextSkills = skills.filter((skill) => skill !== skillToRemove);
    setSkillsBusy(true);
    setSkillsError('');
    try {
      const updatedUser = await updateProfile({ skills: nextSkills });
      setSkills(Array.isArray(updatedUser?.skills) ? updatedUser.skills : nextSkills);
      showSuccess('Profile Updated', 'Your skills were updated successfully.');
    } catch {
      setSkillsError('Unable to update skills right now.');
      showErrorModal('Update Failed', 'Unable to update skills right now.');
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
      showSuccess('Profile Updated', 'Your skills were updated successfully.');
    } catch {
      setSkillsError('Unable to update skills right now.');
      showErrorModal('Update Failed', 'Unable to update skills right now.');
    } finally {
      setSkillsBusy(false);
    }
  };

  const handleSelectInstructor = async () => {
    if (selectedInstructor?.id) {
      setMentorshipError('Instructor selection is locked. Only your instructor can remove you.');
      return;
    }

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

  const handleSubmissionAnswerChange = (assignmentId, value) => {
    setSubmissionDrafts((current) => ({
      ...current,
      [assignmentId]: {
        ...(current[assignmentId] || {}),
        answer: value,
      },
    }));
  };

  const handleSubmissionFileChange = (assignmentId, file) => {
    setSubmissionDrafts((current) => ({
      ...current,
      [assignmentId]: {
        ...(current[assignmentId] || {}),
        submissionAttachment: file || null,
      },
    }));
    setSubmissionImagePreviews((current) => {
      const next = { ...current };
      if (next[assignmentId]) {
        URL.revokeObjectURL(next[assignmentId]);
      }
      if (file && String(file.type || '').startsWith('image/')) {
        next[assignmentId] = URL.createObjectURL(file);
      } else {
        delete next[assignmentId];
      }
      return next;
    });
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const token = LocalStorageService.getToken();
    if (!token) return;

    const draft = submissionDrafts[assignmentId] || {};
    const answer = String(draft.answer || '').trim();
    const submissionAttachment = draft.submissionAttachment || null;

    if (!answer && !submissionAttachment) {
      setSubmissionErrors((current) => ({
        ...current,
        [assignmentId]: 'Add an answer or attachment before submitting.',
      }));
      return;
    }

    try {
      setSubmissionBusyAssignmentId(assignmentId);
      setSubmissionErrors((current) => ({ ...current, [assignmentId]: '' }));
      const response = await mentorshipApi.submitMyAssignment(token, assignmentId, {
        answer,
        submissionAttachment,
      });
      const updatedAssignment = response?.assignment;
      if (!updatedAssignment?.id) return;

      setMentorAssignments((current) =>
        current.map((assignment) => (assignment.id === updatedAssignment.id ? updatedAssignment : assignment))
      );
      setSubmissionDrafts((current) => ({
        ...current,
        [assignmentId]: {
          answer: updatedAssignment?.submission?.answer || answer,
          submissionAttachment: null,
        },
      }));
      setSubmissionImagePreviews((current) => {
        const next = { ...current };
        if (next[assignmentId]) {
          URL.revokeObjectURL(next[assignmentId]);
          delete next[assignmentId];
        }
        return next;
      });
      showSuccess('Submission Saved', 'Assignment submission uploaded successfully.');
    } catch (error) {
      setSubmissionErrors((current) => ({
        ...current,
        [assignmentId]: error?.message || 'Unable to submit assignment right now.',
      }));
      showErrorModal('Submission Failed', error?.message || 'Unable to submit assignment right now.');
    } finally {
      setSubmissionBusyAssignmentId('');
    }
  };

  const handlePortfolioDeleted = async () => {
    setPortfolio(null);
    setPortfolioUpgradeRequired(false);
    setPortfolioError('');
    LocalStorageService.setDashboardAccentIntent('', user?.id);
    if (activeMenuKey === 'portfolio') {
      setActiveMenuKey('profile');
      await persistMenuSelection('profile');
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
                  className={`flex-1 rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${activeAccent.focusRingClass}`}
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
                            className={`w-28 rounded bg-black/20 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 ${activeAccent.focusRingClass}`}
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

      {activeMenuKey === 'profile' && (
        <ProfileSettingsPanel accent={activeAccent} onPortfolioDeleted={handlePortfolioDeleted} />
      )}

      {activeMenuKey === 'settings' && (
        <SettingsPanel accent={activeAccent} />
      )}

      {activeMenuKey === 'projects' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-2">My Projects</h3>
          <p className="text-gray-300">Project management tools are coming soon. Use Code Lab to prototype components now.</p>
        </div>
      )}

      {activeMenuKey === 'quiz-center' && (
        <QuizCenter
          accent={activeAccent}
          userSubscription={user?.subscription}
          userFullName={displayName}
        />
      )}

      {activeMenuKey === 'mentorship' && (
        <div className="space-y-6">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Choose Instructor</h3>
            <p className="text-gray-300 mb-4">
              {isInstructorSelectionLocked
                ? 'Your instructor selection is locked. Only instructors can remove students.'
                : 'Select an instructor. You will be added automatically to that instructor&apos;s dashboard.'}
            </p>

            <div className="grid md:grid-cols-[1fr_auto] gap-3">
              <select
                value={selectedInstructorId}
                onChange={(event) => setSelectedInstructorId(event.target.value)}
                disabled={isInstructorSelectionLocked}
                className={`rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 ${activeAccent.focusRingClass}`}
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
                disabled={mentorshipBusy || isInstructorSelectionLocked}
                className={`px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
              >
                {isInstructorSelectionLocked ? 'Selection Locked' : mentorshipBusy ? 'Saving...' : 'Select Instructor'}
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
                      <>
                        {isImageAttachment(assignment.attachment) && (
                          <div className="mt-2 w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                            <img
                              src={resolveMedia(assignment.attachment.url)}
                              alt="Assignment attachment preview"
                              className="h-24 w-24 rounded object-cover"
                            />
                          </div>
                        )}
                        <a
                          href={resolveMedia(assignment.attachment.url)}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-sm mt-2 inline-block ${activeAccent.linkClass}`}
                        >
                          Open attachment ({assignment.attachment.originalName || 'file'})
                        </a>
                      </>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Score: {Number.isFinite(assignment.score) ? assignment.score : 'Not scored'} | Due:{' '}
                      {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No due date'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Remark: {assignment.remark ? assignment.remark : 'No remark yet'}
                    </p>
                    {assignment.submission?.submittedAt && (
                      <p className={`text-xs mt-2 ${activeAccent.textClass}`}>
                        Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
                      </p>
                    )}
                    <div className="mt-3 space-y-3">
                      <textarea
                        value={submissionDrafts[assignment.id]?.answer || ''}
                        onChange={(event) => handleSubmissionAnswerChange(assignment.id, event.target.value)}
                        placeholder="Write your answer"
                        rows={4}
                        className={`w-full rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${activeAccent.focusRingClass}`}
                      />
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <input
                          type="file"
                          onChange={(event) =>
                            handleSubmissionFileChange(assignment.id, event.target.files?.[0] || null)
                          }
                          className="text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm file:text-white file:bg-white/20 hover:file:bg-white/30"
                        />
                        <button
                          type="button"
                          onClick={() => handleSubmitAssignment(assignment.id)}
                          disabled={submissionBusyAssignmentId === assignment.id}
                          className={`px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
                        >
                          {submissionBusyAssignmentId === assignment.id ? 'Submitting...' : 'Submit Assignment'}
                        </button>
                      </div>
                      {submissionImagePreviews[assignment.id] && (
                        <div className="w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                          <img
                            src={submissionImagePreviews[assignment.id]}
                            alt="Submission preview"
                            className="h-24 w-24 rounded object-cover"
                          />
                        </div>
                      )}
                      {assignment.submission?.attachment?.url && (
                        <>
                          {isImageAttachment(assignment.submission.attachment) && (
                            <div className="w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                              <img
                                src={resolveMedia(assignment.submission.attachment.url)}
                                alt="Submitted assignment preview"
                                className="h-24 w-24 rounded object-cover"
                              />
                            </div>
                          )}
                          <a
                            href={resolveMedia(assignment.submission.attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-sm inline-block ${activeAccent.linkClass}`}
                          >
                            View submitted file ({assignment.submission.attachment.originalName || 'file'})
                          </a>
                        </>
                      )}
                      {submissionErrors[assignment.id] && (
                        <p className="text-sm text-red-300">{submissionErrors[assignment.id]}</p>
                      )}
                    </div>
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

      {activeMenuKey === 'portfolio-upgrade' && portfolioUpgradeRequired && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-2">Portfolio Access Locked</h3>
          <p className="text-gray-300">{UPGRADE_PROMPT}</p>
          <a
            href="/pricing"
            className={`inline-flex mt-4 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
          >
            Upgrade Plan
          </a>
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
