import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, Code2, ExternalLink, Network, PlusCircle, Settings, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import ReactPlayground from '../../components/ReactPlayground';
import LocalStorageService from '../../services/localStorageService';
import PortfolioBuilder from '../../components/PortfolioBuilder';
import { portfolioApi } from '../../services/portfolioApi';
import { authApi } from '../../services/authApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';
import { useModal } from '../../hooks/useModal';
import ProfileSettingsPanel from '../../components/ProfileSettingsPanel';
import SettingsPanel from '../../components/SettingsPanel';

const UPGRADE_PROMPT = 'Upgrade to a better plan to access your portfolio.';

const ProfessionalDashboard = () => {
  const { loading, isAuthenticated, user, getDashboardPath, updateProfile } = useAuth();
  const { showSuccess, showError: showErrorModal, confirm } = useModal();
  const displayName = user?.fullName || user?.username || 'Professional';
  const menuStorageKey = user?.role === ROLES.ORGANIZATION ? 'organization' : 'professional';
  const [activeMenuKey, setActiveMenuKey] = useState('overview');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState(() => (Array.isArray(user?.skills) ? user.skills : []));
  const [skillsBusy, setSkillsBusy] = useState(false);
  const [skillsError, setSkillsError] = useState('');
  const [editingSkill, setEditingSkill] = useState('');
  const [editingSkillValue, setEditingSkillValue] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [portfolioError, setPortfolioError] = useState('');
  const [portfolioUpgradeRequired, setPortfolioUpgradeRequired] = useState(false);
  const [accentKey, setAccentKey] = useState(() => LocalStorageService.getDashboardAccent(user?.id));
  const portfolioUpdateQueueRef = useRef(Promise.resolve());
  const lastPortfolioMutationAtRef = useRef(0);
  const accentIntentRef = useRef('');
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
  const menuItems = [
    { key: 'overview', label: 'Overview', icon: BarChart3, badge: 'Now' },
    { key: 'profile', label: 'Profile', icon: UserCircle, badge: 'Now' },
    { key: 'experience', label: 'Experience', icon: BriefcaseBusiness, badge: 'Soon' },
    { key: 'network', label: 'Network', icon: Network, badge: 'Soon' },
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
    const savedMenuKey = user?.dashboardMenu?.[menuStorageKey];
    const validMenuKeys = menuItems.map((item) => item.key);
    if (savedMenuKey && validMenuKeys.includes(savedMenuKey)) {
      setActiveMenuKey((currentKey) => (currentKey === savedMenuKey ? currentKey : savedMenuKey));
    }
  }, [hasPortfolio, menuStorageKey, user?.dashboardMenu]);

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
    const handleAccentChanged = (event) => {
      setAccentKey(event?.detail?.accent || LocalStorageService.getDashboardAccent(user?.id));
    };
    window.addEventListener('devportix:accent-changed', handleAccentChanged);
    return () => window.removeEventListener('devportix:accent-changed', handleAccentChanged);
  }, [user?.id]);

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== ROLES.PROFESSIONAL && user?.role !== ROLES.ORGANIZATION) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  const persistMenuSelection = async (key) => {
    try {
      await updateProfile({
        dashboardMenu: {
          ...(user?.dashboardMenu || {}),
          [menuStorageKey]: key,
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
      role="Professional"
      title="Professional Dashboard"
      subtitle={`Welcome, ${displayName}. Build your advanced portfolio for career growth.`}
      accentClass={activeAccent.textClass}
      activeTabClass={activeAccent.primaryButtonClass}
      menuItems={menuItems}
      activeMenuKey={activeMenuKey}
      onMenuSelect={handleMenuSelect}
    >
      {activeMenuKey === 'overview' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Career</p>
            <h3 className="font-semibold text-xl mt-3 mb-2 text-white">Experience</h3>
            <p className="text-gray-300 mb-4">Showcase your work history with cleaner story-driven sections.</p>
            <div className={`text-sm font-semibold ${activeAccent.textClass}`}>Coming Soon</div>
          </div>

          <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Work</p>
            <h3 className="font-semibold text-xl mt-3 mb-2 text-white">Projects</h3>
            <p className="text-gray-300 mb-4">Highlight professional projects and measurable outcomes.</p>
            <div className={`text-sm font-semibold ${activeAccent.textClass}`}>Coming Soon</div>
          </div>

          <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Community</p>
            <h3 className="font-semibold text-xl mt-3 mb-2 text-white">Network</h3>
            <p className="text-gray-300 mb-4">Connect with other professionals through a cleaner hub layout.</p>
            <div className={`text-sm font-semibold ${activeAccent.textClass}`}>Coming Soon</div>
          </div>

          <div className="dashboard-panel dashboard-stat-card rounded-[1.5rem] p-6">
            <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Identity</p>
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
      )}

      {activeMenuKey === 'profile' && (
        <ProfileSettingsPanel accent={activeAccent} onPortfolioDeleted={handlePortfolioDeleted} />
      )}

      {activeMenuKey === 'settings' && (
        <SettingsPanel accent={activeAccent} />
      )}

      {activeMenuKey === 'experience' && (
        <div className="dashboard-panel rounded-[1.5rem] p-6">
          <h3 className="font-semibold text-lg mb-4 text-white">Professional Features</h3>
          <ul className="space-y-3 text-gray-300">
            <li>1. Detailed work experience with metrics.</li>
            <li>2. Integration with GitHub and LinkedIn.</li>
            <li>3. Analytics on portfolio views.</li>
          </ul>
        </div>
      )}

      {activeMenuKey === 'network' && (
        <div className="dashboard-panel rounded-[1.5rem] p-6">
          <h3 className="font-semibold text-lg mb-2 text-white">Network</h3>
          <p className="text-gray-300">Professional networking tools are coming soon.</p>
        </div>
      )}

      {activeMenuKey === 'create-portfolio' && !hasPortfolio && (
        <div className="dashboard-panel rounded-[1.5rem] p-6">
          <h3 className="text-xl font-semibold text-white mb-2">Create Portfolio</h3>
          <p className="text-gray-300">
            Generate your professional portfolio page to start customizing it.
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
        <ReactPlayground storageKey="professional-dashboard-react-playground" title="Professional React Playground" />
      )}
    </DashboardShell>
  );
};

export default ProfessionalDashboard;
