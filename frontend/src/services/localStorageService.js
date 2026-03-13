import { v4 as uuidv4 } from 'uuid';

// Keys for localStorage
const STORAGE_KEYS = {
  USER: 'devportix_user',
  USERS: 'devportix_users',
  TOKEN: 'devportix_token',
  PROJECTS: 'devportix_projects',
  PORTFOLIO_SETTINGS: 'devportix_portfolio_settings',
  PORTFOLIOS: 'devportix_portfolios',
  THEME: 'devportix_theme',
  DASHBOARD_ACCENT: 'devportix_dashboard_accent',
  DASHBOARD_ACCENT_BY_USER: 'devportix_dashboard_accent_by_user',
  DASHBOARD_ACCENT_INTENT_BY_USER: 'devportix_dashboard_accent_intent_by_user',
};

const SUBSCRIPTION_PROJECT_LIMITS = {
  free: 4,
  basic: 20,
  standard: 100,
  premium: 250,
};

class LocalStorageService {
  static normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  static normalizeUsername(username) {
    return String(username || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  static toPublicUser(user) {
    if (!user) return null;
    const { password: _password, ...publicUser } = user;
    return publicUser;
  }

  static normalizeSubscription(subscription) {
    const normalized = String(subscription || 'free').trim().toLowerCase();
    if (normalized === 'pro') {
      return 'premium';
    }
    if (normalized === 'free' || normalized === 'basic' || normalized === 'standard' || normalized === 'premium') {
      return normalized;
    }
    return 'free';
  }

  static getProjectLimitForSubscription(subscription) {
    const normalized = this.normalizeSubscription(subscription);
    return SUBSCRIPTION_PROJECT_LIMITS[normalized];
  }

  static getProjectsForUser(user = this.getUser()) {
    const projects = this.getProjects();
    if (!user) return projects;

    const userId = user.id;
    const userEmail = this.normalizeEmail(user.email);

    return projects.filter((project) => {
      if (project.ownerId || project.ownerEmail) {
        return (
          (project.ownerId && project.ownerId === userId) ||
          (project.ownerEmail && this.normalizeEmail(project.ownerEmail) === userEmail)
        );
      }

      // Backward compatibility for legacy single-user records with no owner metadata.
      return true;
    });
  }

  static getProjectCountForUser(user = this.getUser()) {
    return this.getProjectsForUser(user).length;
  }

  static canCreateProject(user = this.getUser()) {
    if (!user) return { allowed: true, limit: Infinity, current: 0 };

    const limit = this.getProjectLimitForSubscription(user.subscription);
    const current = this.getProjectCountForUser(user);
    const allowed = current < limit;

    return { allowed, limit, current };
  }

  // Registered users management
  static getRegisteredUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : [];
  }

  static setRegisteredUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static ensureDefaultUser() {
    const defaultEmail = 'brian@gmail.com';
    const exists = this.findRegisteredUserByEmail(defaultEmail);
    if (exists) return this.toPublicUser(exists);

    return this.registerUser({
      email: defaultEmail,
      password: 'brian',
      fullName: 'Brian',
      role: 'professional',
      githubUsername: 'brian',
    });
  }

  static findRegisteredUserByEmail(email) {
    const normalizedEmail = this.normalizeEmail(email);
    return this.getRegisteredUsers().find(
      (u) => this.normalizeEmail(u.email) === normalizedEmail
    ) || null;
  }

  static registerUser(userData) {
    const email = this.normalizeEmail(userData?.email);
    const password = String(userData?.password || '');

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const users = this.getRegisteredUsers();
    const userExists = users.some((u) => this.normalizeEmail(u.email) === email);
    if (userExists) {
      throw new Error('An account with this email already exists');
    }

    const requestedRole = String(userData?.role || 'student').trim().toLowerCase();
    const normalizedRole = requestedRole || 'student';
    const normalizedSubscription = this.normalizeSubscription(
      userData.subscription || (normalizedRole === 'organization' ? 'basic' : 'free')
    );

    const registeredUser = {
      id: userData.id || uuidv4(),
      email,
      password,
      username: userData.username || email.split('@')[0],
      fullName: userData.fullName || 'New User',
      avatar: userData.avatar || null,
      githubUsername: userData.githubUsername || null,
      theme: userData.theme || 'dark',
      subscription: normalizedSubscription,
      role: normalizedRole,
      createdAt: userData.createdAt || new Date().toISOString(),
    };

    users.push(registeredUser);
    this.setRegisteredUsers(users);
    return this.toPublicUser(registeredUser);
  }

  static authenticateUser(email, password) {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedPassword = String(password || '');
    const user = this.getRegisteredUsers().find(
      (u) =>
        this.normalizeEmail(u.email) === normalizedEmail &&
        String(u.password) === normalizedPassword
    );
    return this.toPublicUser(user);
  }

  // User management
  static setUser(user) {
    const normalizedRole = String(user.role || 'student').trim().toLowerCase();
    const fallbackSubscription = normalizedRole === 'organization' ? 'basic' : 'free';
    const userData = {
      ...user,
      id: user.id || uuidv4(),
      role: user.role || 'student',
      subscription: this.normalizeSubscription(user.subscription || fallbackSubscription),
      createdAt: user.createdAt || new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
    return userData;
  }

  static getUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  static updateUser(updates) {
    const user = this.getUser();
    if (user) {
      const updatedUser = { ...user, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      const users = this.getRegisteredUsers();
      const index = users.findIndex((u) => u.id === updatedUser.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        this.setRegisteredUsers(users);
      }

      return updatedUser;
    }
    return null;
  }

  static clearUser() {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
  }

  // Token management
  static setToken(token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }

  static getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  static isAuthenticated() {
    return !!this.getToken() && !!this.getUser();
  }

  // Project management
  static getProjects() {
    const projects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    return projects ? JSON.parse(projects) : [];
  }

  static setProjects(projects) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static addProject(project) {
    const currentUser = this.getUser();
    const { allowed, limit, current } = this.canCreateProject(currentUser);

    if (currentUser && !allowed) {
      const isUnlimited = Number.isFinite(limit) === false;
      const error = new Error(
        isUnlimited
          ? 'You have reached your project limit for your current plan.'
          : `You have reached your ${currentUser.subscription} plan limit (${limit} projects). Upgrade to add more projects.`
      );
      error.code = 'PLAN_LIMIT_EXCEEDED';
      error.details = {
        subscription: this.normalizeSubscription(currentUser.subscription),
        limit,
        current,
      };
      throw error;
    }

    const projects = this.getProjects();
    const newProject = {
      ...project,
      id: uuidv4(),
      ownerId: currentUser?.id || null,
      ownerEmail: currentUser?.email || null,
      createdAt: new Date().toISOString(),
    };
    projects.push(newProject);
    this.setProjects(projects);
    return newProject;
  }

  static updateProject(id, updates) {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === id);
    if (index !== -1) {
      projects[index] = { ...projects[index], ...updates, updatedAt: new Date().toISOString() };
      this.setProjects(projects);
      return projects[index];
    }
    return null;
  }

  static deleteProject(id) {
    const projects = this.getProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    this.setProjects(filteredProjects);
    return filteredProjects;
  }

  static getProject(id) {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  // Portfolio settings
  static getPortfolioSettings() {
    const settings = localStorage.getItem(STORAGE_KEYS.PORTFOLIO_SETTINGS);
    const defaultSettings = {
      theme: 'minimal-dark',
      layout: 'grid',
      visibleSections: ['hero', 'projects', 'skills', 'contact'],
      customCSS: '',
      seoTitle: 'My Developer Portfolio',
      seoDescription: 'A portfolio built with DEVPORTIX',
      customDomain: null,
    };
    
    return settings ? { ...defaultSettings, ...JSON.parse(settings) } : defaultSettings;
  }

  static setPortfolioSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO_SETTINGS, JSON.stringify(settings));
  }

  static getPortfolios() {
    const portfolios = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
    return portfolios ? JSON.parse(portfolios) : {};
  }

  static setPortfolios(portfolios) {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
  }

  static getDefaultPortfolio(user = this.getUser()) {
    const username = user?.username || user?.fullName || 'developer';
    return {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ownerId: user?.id || null,
      ownerEmail: user?.email || null,
      username,
      slug: this.normalizeUsername(username) || 'developer',
      displayName: user?.fullName || username,
      headline: 'Developer Portfolio',
      bio: 'Building thoughtful software and shipping impactful products.',
      heroIntro: {
        title: user?.fullName || username,
        subtitle: 'Portfolio',
        summary: 'Welcome to my portfolio.',
      },
      projects: [],
      skills: [],
      timeline: [],
      certifications: [],
      contact: {
        email: user?.email || '',
        phone: '',
        location: '',
        website: '',
      },
      experienceLevel: 1,
      accent: 'blue',
      screenshots: [],
      codeSnippets: [],
      documents: [],
    };
  }

  static getPortfolioForUser(user = this.getUser()) {
    if (!user) return null;
    const all = this.getPortfolios();
    return all[user.id] || null;
  }

  static createPortfolioForUser(user = this.getUser()) {
    if (!user) throw new Error('User is required');
    const existing = this.getPortfolioForUser(user);
    if (existing) return existing;

    const all = this.getPortfolios();
    const portfolio = this.getDefaultPortfolio(user);
    all[user.id] = portfolio;
    this.setPortfolios(all);
    return portfolio;
  }

  static updatePortfolioForUser(updates, user = this.getUser()) {
    if (!user) throw new Error('User is required');
    const all = this.getPortfolios();
    const current = all[user.id] || this.getDefaultPortfolio(user);
    const updated = {
      ...current,
      ...updates,
      username: updates?.username || current.username,
      slug: this.normalizeUsername(updates?.username || current.username) || current.slug,
      updatedAt: new Date().toISOString(),
    };
    all[user.id] = updated;
    this.setPortfolios(all);
    return updated;
  }

  static findPortfolioByUsername(username) {
    const normalized = this.normalizeUsername(username);
    const all = this.getPortfolios();
    const portfolioList = Object.values(all);
    return (
      portfolioList.find((portfolio) => this.normalizeUsername(portfolio.slug) === normalized) ||
      portfolioList.find((portfolio) => this.normalizeUsername(portfolio.username) === normalized) ||
      null
    );
  }

  // Theme management
  static getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  }

  static setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  static getDashboardAccent(userId = null) {
    const normalizedUserId = String(userId || '').trim();
    if (normalizedUserId) {
      const raw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_ACCENT_BY_USER);
      if (raw) {
        try {
          const byUser = JSON.parse(raw);
          const userAccent = String(byUser?.[normalizedUserId] || '').trim().toLowerCase();
          const allowedAccents = ['blue', 'emerald', 'rose', 'amber', 'violet'];
          if (allowedAccents.includes(userAccent)) {
            return userAccent;
          }
        } catch {
          // fall back to global key
        }
      }
    }

    const accent = String(localStorage.getItem(STORAGE_KEYS.DASHBOARD_ACCENT) || 'blue').trim().toLowerCase();
    const allowedAccents = ['blue', 'emerald', 'rose', 'amber', 'violet'];
    return allowedAccents.includes(accent) ? accent : 'blue';
  }

  static setDashboardAccent(accent, userId = null) {
    const normalizedAccent = String(accent || 'blue').trim().toLowerCase();
    const allowedAccents = ['blue', 'emerald', 'rose', 'amber', 'violet'];
    const nextAccent = allowedAccents.includes(normalizedAccent) ? normalizedAccent : 'blue';
    localStorage.setItem(STORAGE_KEYS.DASHBOARD_ACCENT, nextAccent);

    const normalizedUserId = String(userId || '').trim();
    if (normalizedUserId) {
      const raw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_ACCENT_BY_USER);
      let byUser = {};
      if (raw) {
        try {
          byUser = JSON.parse(raw) || {};
        } catch {
          byUser = {};
        }
      }
      byUser[normalizedUserId] = nextAccent;
      localStorage.setItem(STORAGE_KEYS.DASHBOARD_ACCENT_BY_USER, JSON.stringify(byUser));
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('devportix:accent-changed', { detail: { accent: nextAccent } }));
    }
    return nextAccent;
  }

  static getDashboardAccentIntent(userId = null) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return '';

    const raw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_ACCENT_INTENT_BY_USER);
    if (!raw) return '';
    try {
      const byUser = JSON.parse(raw) || {};
      const accent = String(byUser?.[normalizedUserId] || '').trim().toLowerCase();
      const allowedAccents = ['blue', 'emerald', 'rose', 'amber', 'violet'];
      return allowedAccents.includes(accent) ? accent : '';
    } catch {
      return '';
    }
  }

  static setDashboardAccentIntent(accent, userId = null) {
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId) return '';

    const normalizedAccent = String(accent || '').trim().toLowerCase();
    const allowedAccents = ['blue', 'emerald', 'rose', 'amber', 'violet'];
    const nextAccent = allowedAccents.includes(normalizedAccent) ? normalizedAccent : '';

    const raw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_ACCENT_INTENT_BY_USER);
    let byUser = {};
    if (raw) {
      try {
        byUser = JSON.parse(raw) || {};
      } catch {
        byUser = {};
      }
    }

    if (nextAccent) {
      byUser[normalizedUserId] = nextAccent;
    } else {
      delete byUser[normalizedUserId];
    }

    localStorage.setItem(STORAGE_KEYS.DASHBOARD_ACCENT_INTENT_BY_USER, JSON.stringify(byUser));
    return nextAccent;
  }

  // Mock analytics data
  static getAnalytics() {
    const mockAnalytics = {
      totalViews: 1245,
      uniqueVisitors: 892,
      projectsCount: this.getProjects().length,
      lastUpdated: new Date().toISOString(),
      weeklyStats: [
        { day: 'Mon', views: 120 },
        { day: 'Tue', views: 200 },
        { day: 'Wed', views: 180 },
        { day: 'Thu', views: 240 },
        { day: 'Fri', views: 300 },
        { day: 'Sat', views: 150 },
        { day: 'Sun', views: 100 },
      ],
    };
    return mockAnalytics;
  }

  // Mock GitHub repositories
  static getGitHubRepos() {
    const mockRepos = [
      {
        id: uuidv4(),
        name: 'react-portfolio',
        description: 'A modern React portfolio template',
        language: 'JavaScript',
        stars: 45,
        forks: 12,
        updatedAt: '2024-01-15',
        html_url: 'https://github.com/username/react-portfolio',
      },
      {
        id: uuidv4(),
        name: 'ecommerce-api',
        description: 'Node.js eCommerce API',
        language: 'TypeScript',
        stars: 89,
        forks: 23,
        updatedAt: '2024-01-10',
        html_url: 'https://github.com/username/ecommerce-api',
      },
      {
        id: uuidv4(),
        name: 'ai-chatbot',
        description: 'Python AI chatbot with OpenAI',
        language: 'Python',
        stars: 156,
        forks: 45,
        updatedAt: '2024-01-05',
        html_url: 'https://github.com/username/ai-chatbot',
      },
    ];
    return mockRepos;
  }

  // Export all data
  static exportData() {
    return {
      user: this.getUser(),
      projects: this.getProjects(),
      portfolios: this.getPortfolios(),
      portfolioSettings: this.getPortfolioSettings(),
      analytics: this.getAnalytics(),
      exportedAt: new Date().toISOString(),
    };
  }

  // Import data
  static importData(data) {
    if (data.user) this.setUser(data.user);
    if (data.projects) this.setProjects(data.projects);
    if (data.portfolios) this.setPortfolios(data.portfolios);
    if (data.portfolioSettings) this.setPortfolioSettings(data.portfolioSettings);
    return true;
  }
}

export default LocalStorageService;
