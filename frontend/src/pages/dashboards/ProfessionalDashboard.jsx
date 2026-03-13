import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { BarChart3, BriefcaseBusiness, Code2, ExternalLink, Network, PlusCircle, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';
import DashboardShell from '../../components/DashboardShell';
import ReactPlayground from '../../components/ReactPlayground';
import LocalStorageService from '../../services/localStorageService';
import PortfolioBuilder from '../../components/PortfolioBuilder';
import { portfolioApi } from '../../services/portfolioApi';
import { authApi } from '../../services/authApi';
import { getDashboardAccent } from '../../utils/dashboardAccent';

const ProfessionalDashboard = () => {
  const { loading, isAuthenticated, user, getDashboardPath, updateProfile } = useAuth();
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
  const activeAccent = getDashboardAccent(portfolio?.accent || 'violet');
  const hasPortfolio = Boolean(portfolio);
  const portfolioPath = hasPortfolio
    ? `/portfolio/${portfolio?.slug || portfolio?.username || ''}`
    : null;
  const menuItems = [
    { key: 'overview', label: 'Overview', icon: BarChart3, badge: 'Now' },
    { key: 'experience', label: 'Experience', icon: BriefcaseBusiness, badge: 'Soon' },
    { key: 'network', label: 'Network', icon: Network, badge: 'Soon' },
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
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 text-white">Experience</h3>
            <p className="text-gray-300 mb-4">Showcase your work history</p>
            <div className={`text-sm ${activeAccent.textClass}`}>Coming Soon</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 text-white">Projects</h3>
            <p className="text-gray-300 mb-4">Highlight professional projects</p>
            <div className={`text-sm ${activeAccent.textClass}`}>Coming Soon</div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2 text-white">Network</h3>
            <p className="text-gray-300 mb-4">Connect with other professionals</p>
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
      )}

      {activeMenuKey === 'experience' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4 text-white">Professional Features</h3>
          <ul className="space-y-3 text-gray-300">
            <li>1. Detailed work experience with metrics.</li>
            <li>2. Integration with GitHub and LinkedIn.</li>
            <li>3. Analytics on portfolio views.</li>
          </ul>
        </div>
      )}

      {activeMenuKey === 'network' && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-2 text-white">Network</h3>
          <p className="text-gray-300">Professional networking tools are coming soon.</p>
        </div>
      )}

      {activeMenuKey === 'create-portfolio' && !hasPortfolio && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
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
