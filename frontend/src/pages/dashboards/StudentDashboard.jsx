import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BookOpen, Code2, ExternalLink, FolderGit2, LineChart, PlusCircle, Settings, Trophy, UserCircle } from 'lucide-react';
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
import { resolveMediaUrl } from '../../utils/api';
const isImageAttachment = (attachment) => {
  const mimeType = String(attachment?.mimeType || '').toLowerCase();
  const fileName = String(attachment?.originalName || attachment?.url || '').toLowerCase();
  if (mimeType.startsWith('image/')) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/.test(fileName);
};
const UPGRADE_PROMPT = 'Upgrade to a better plan to access your portfolio.';
const EMPTY_GROWTH_SUMMARY = {
  totalItems: 0,
  assignmentsCount: 0,
  projectsCount: 0,
  submittedCount: 0,
  reviewedCount: 0,
  pendingCount: 0,
  averageScore: null,
  latestRemark: '',
  latestReviewedAt: null,
};
const getWorkTypeLabel = (item) => (item?.type === 'project' ? 'Project' : 'Assignment');

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
  const [growthSummary, setGrowthSummary] = useState(EMPTY_GROWTH_SUMMARY);
  const [mentorshipBusy, setMentorshipBusy] = useState(false);
  const [mentorshipError, setMentorshipError] = useState('');
  const [growthFilter, setGrowthFilter] = useState('all');
  const [submissionDrafts, setSubmissionDrafts] = useState({});
  const [submissionImagePreviews, setSubmissionImagePreviews] = useState({});
  const [submissionBusyAssignmentId, setSubmissionBusyAssignmentId] = useState('');
  const [submissionErrors, setSubmissionErrors] = useState({});
  const submissionImagePreviewsRef = useRef({});
  const [portfolioUpgradeRequired, setPortfolioUpgradeRequired] = useState(false);
  const [accentKey, setAccentKey] = useState(() => LocalStorageService.getDashboardAccent(user?.id));
  const activeAccent = getDashboardAccent(
    LocalStorageService.getDashboardAccentIntent(user?.id) ||
    accentKey ||
    LocalStorageService.getDashboardAccent(user?.id) ||
    portfolio?.accent
  );
  const hasPortfolio = Boolean(portfolio);
  const portfolioPath = hasPortfolio
    ? `/portfolio/${portfolio?.slug || portfolio?.username || ''}`
    : null;
  const menuItems = useMemo(() => [
    { key: 'overview', label: 'Overview', icon: BookOpen, badge: 'Now' },
    { key: 'profile', label: 'Profile', icon: UserCircle, badge: 'Now' },
    { key: 'quiz-center', label: 'Quiz Center', icon: Trophy, badge: 'Now' },
    { key: 'projects', label: 'My Projects', icon: FolderGit2, badge: 'Soon' },
    { key: 'mentorship', label: 'Mentorship', icon: BookOpen, badge: 'Now' },
    { key: 'growth-monitor', label: 'Growth Monitor', icon: LineChart, badge: 'Live' },
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
  ], [hasPortfolio, portfolioPath, portfolioUpgradeRequired]);
  useEffect(() => {
    const savedMenuKey = user?.dashboardMenu?.student;
    const validMenuKeys = menuItems.map((item) => item.key);
    if (savedMenuKey && validMenuKeys.includes(savedMenuKey)) {
      setActiveMenuKey((currentKey) => (currentKey === savedMenuKey ? currentKey : savedMenuKey));
    }
  }, [menuItems, user?.dashboardMenu?.student]);

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
    if (!user?.id) return;
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
        setGrowthSummary(mentorshipResponse?.growthSummary || EMPTY_GROWTH_SUMMARY);
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

  const filteredGrowthItems = useMemo(() => {
    if (growthFilter === 'assignment') {
      return mentorAssignments.filter((item) => item.type !== 'project');
    }
    if (growthFilter === 'project') {
      return mentorAssignments.filter((item) => item.type === 'project');
    }
    if (growthFilter === 'reviewed') {
      return mentorAssignments.filter((item) => item.reviewStatus === 'reviewed');
    }
    return mentorAssignments;
  }, [growthFilter, mentorAssignments]);

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
      const itemTypeLabel = getWorkTypeLabel(updatedAssignment);
      showSuccess('Submission Saved', `${itemTypeLabel} submission uploaded successfully.`);
    } catch (error) {
      setSubmissionErrors((current) => ({
        ...current,
        [assignmentId]: error?.message || 'Unable to submit assignment right now.',
      }));
      showErrorModal('Submission Failed', error?.message || 'Unable to submit work right now.');
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
            <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Portfolio</p>
              <h3 className="font-semibold text-xl mt-3 mb-2 text-white">Portfolio Status</h3>
              <p className="text-gray-300 mb-6">Your portfolio is ready to be built and published when you are.</p>
              <div className="flex items-end justify-between gap-3">
                <div className={`text-3xl font-bold ${activeAccent.textClass}`}>{hasPortfolio ? '100%' : '0%'}</div>
                <span className="dashboard-metric-chip text-gray-200">{hasPortfolio ? 'Live now' : 'Ready to start'}</span>
              </div>
            </div>

            <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Growth</p>
              <h3 className="font-semibold text-xl mt-3 mb-2 text-white">Reviewed Work</h3>
              <p className="text-gray-300 mb-6">Track how your instructor is scoring your assignments and projects.</p>
              <div className={`text-sm font-semibold ${activeAccent.textClass}`}>
                {growthSummary.reviewedCount} reviewed item{growthSummary.reviewedCount === 1 ? '' : 's'}
              </div>
            </div>

            <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Profile</p>
              <h3 className="font-semibold text-xl mt-3 mb-2 text-white">Skills</h3>
              <p className="text-gray-300 mb-4">Add and save the skills you want to showcase.</p>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(event) => setSkillInput(event.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  placeholder="Type a skill (e.g. React)"
                  className={`dashboard-input flex-1 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${activeAccent.focusRingClass}`}
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
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white"
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

          <div className="dashboard-panel rounded-[1.5rem] p-6 mb-8">
            <h3 className="font-semibold text-lg mb-2 text-white">My Instructor</h3>
            {selectedInstructor ? (
              <p className="text-gray-300">
                {selectedInstructor.fullName} ({selectedInstructor.email})
              </p>
            ) : (
              <p className="text-gray-400">No instructor selected yet.</p>
            )}
          </div>

          <div className="dashboard-panel rounded-[1.5rem] p-6 mb-8">
            <h3 className="font-semibold text-lg mb-4 text-white">Getting Started</h3>
            <ul className="space-y-3 text-gray-300">
              <li>1. Complete your profile information.</li>
              <li>2. Choose an instructor from the Mentorship menu.</li>
              <li>3. Submit your assigned work and watch your growth monitor update.</li>
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
        <div className="dashboard-panel rounded-[1.5rem] p-6">
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
          <div className="dashboard-panel rounded-[1.5rem] p-6">
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
                className={`dashboard-input rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 ${activeAccent.focusRingClass}`}
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

          <div className="dashboard-panel rounded-[1.5rem] p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Mentorship Snapshot</h3>
            <p className="text-gray-300">Once your instructor gives you assignments or projects, they will appear in Growth Monitor with scores and remarks.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Assigned</p>
                <p className="mt-3 text-3xl font-bold text-white">{growthSummary.totalItems}</p>
                <p className="mt-2 text-sm text-gray-300">
                  {growthSummary.assignmentsCount} assignments and {growthSummary.projectsCount} projects
                </p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Submitted</p>
                <p className="mt-3 text-3xl font-bold text-white">{growthSummary.submittedCount}</p>
                <p className="mt-2 text-sm text-gray-300">Keep sending in your work to unlock more feedback.</p>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Average Score</p>
                <p className="mt-3 text-3xl font-bold text-white">
                  {Number.isFinite(growthSummary.averageScore) ? `${growthSummary.averageScore}%` : '--'}
                </p>
                <p className="mt-2 text-sm text-gray-300">Updated as soon as your instructor reviews your submissions.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMenuKey === 'growth-monitor' && (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
            <div className="dashboard-panel rounded-[1.75rem] p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className={`text-xs uppercase tracking-[0.24em] ${activeAccent.textClass}`}>Growth Monitor</p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">Every assignment, project, score, and remark in one place</h3>
                  <p className="mt-3 max-w-2xl text-gray-300">
                    Review what your instructor assigned, submit work, and keep track of how your performance is improving over time.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'all', label: 'All work' },
                    { key: 'assignment', label: 'Assignments' },
                    { key: 'project', label: 'Projects' },
                    { key: 'reviewed', label: 'Reviewed' },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setGrowthFilter(filter.key)}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        growthFilter === filter.key
                          ? `${activeAccent.primaryButtonClass} text-white`
                          : 'border border-white/10 bg-white/5 text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="dashboard-panel rounded-[1.75rem] p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Progress Snapshot</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs text-gray-400">Reviewed</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{growthSummary.reviewedCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs text-gray-400">Pending</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{growthSummary.pendingCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs text-gray-400">Projects</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{growthSummary.projectsCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs text-gray-400">Average</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {Number.isFinite(growthSummary.averageScore) ? `${growthSummary.averageScore}%` : '--'}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-300">
                {growthSummary.latestRemark
                  ? `Latest remark: ${growthSummary.latestRemark}`
                  : 'Your newest feedback will surface here once a review is posted.'}
              </p>
            </div>
          </div>

          <div className="dashboard-panel rounded-[1.5rem] p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-xl font-semibold text-white">Growth Timeline</h3>
              <span className="text-sm text-gray-400">{filteredGrowthItems.length} item(s)</span>
            </div>
            {filteredGrowthItems.length === 0 ? (
              <p className="text-gray-300">No matching growth records yet. Ask your instructor for your first assignment or project.</p>
            ) : (
              <div className="space-y-4">
                {filteredGrowthItems.map((assignment) => (
                  <div key={assignment.id} className="dashboard-panel rounded-[1.5rem] p-5 bg-black/10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${activeAccent.textClass} ${activeAccent.borderClass}`}>
                            {assignment.typeLabel || getWorkTypeLabel(assignment)}
                          </span>
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                            {assignment.submissionStatus === 'submitted' ? 'Submitted' : 'Awaiting submission'}
                          </span>
                          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                            {assignment.reviewStatus === 'reviewed' ? 'Reviewed' : 'Awaiting review'}
                          </span>
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-white">{assignment.title}</h4>
                        <p className="mt-2 text-sm text-gray-300">{assignment.question}</p>
                        {assignment.details && <p className="mt-2 text-sm text-gray-400">{assignment.details}</p>}
                      </div>
                      <div className="min-w-[180px] rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Score</p>
                        <p className="mt-2 text-3xl font-semibold text-white">
                          {Number.isFinite(assignment.score) ? `${assignment.score}%` : '--'}
                        </p>
                        <p className="mt-2 text-xs text-gray-400">
                          Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'anytime'}
                        </p>
                      </div>
                    </div>
                    {assignment.attachment?.url && (
                      <div className="mt-4">
                        {isImageAttachment(assignment.attachment) && (
                          <div className="w-fit rounded-lg border border-white/20 p-2 bg-black/20">
                            <img
                              src={resolveMediaUrl(assignment.attachment.url)}
                              alt={`${getWorkTypeLabel(assignment)} attachment preview`}
                              className="h-24 w-24 rounded object-cover"
                            />
                          </div>
                        )}
                        <a
                          href={resolveMediaUrl(assignment.attachment.url)}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-sm mt-2 inline-block ${activeAccent.linkClass}`}
                        >
                          Open attachment ({assignment.attachment.originalName || 'file'})
                        </a>
                      </div>
                    )}
                    <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                      <div className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Instructor Remark</p>
                        <p className="mt-3 text-sm text-gray-200">
                          {assignment.remark ? assignment.remark : 'No remark yet. Submit your work and check back after review.'}
                        </p>
                      </div>
                      <div className="rounded-[1.25rem] border border-white/10 bg-black/15 p-4">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Submission History</p>
                        <p className="mt-3 text-sm text-gray-200">
                          {assignment.submission?.submittedAt
                            ? `Submitted ${new Date(assignment.submission.submittedAt).toLocaleString()}`
                            : 'Not submitted yet'}
                        </p>
                        {assignment.submission?.attachment?.url && (
                          <a
                            href={resolveMediaUrl(assignment.submission.attachment.url)}
                            target="_blank"
                            rel="noreferrer"
                            className={`mt-2 inline-block text-sm ${activeAccent.linkClass}`}
                          >
                            View submitted file ({assignment.submission.attachment.originalName || 'file'})
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={submissionDrafts[assignment.id]?.answer || ''}
                        onChange={(event) => handleSubmissionAnswerChange(assignment.id, event.target.value)}
                        placeholder={assignment.type === 'project' ? 'Describe your project delivery or update' : 'Write your answer'}
                        rows={4}
                        className={`dashboard-input w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 ${activeAccent.focusRingClass}`}
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
                          {submissionBusyAssignmentId === assignment.id
                            ? 'Submitting...'
                            : `Submit ${getWorkTypeLabel(assignment)}`}
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
        <div className="dashboard-panel rounded-[1.5rem] p-6">
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
        <div className="dashboard-panel rounded-[1.5rem] p-6">
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
