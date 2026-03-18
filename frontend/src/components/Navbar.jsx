import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import logo from '../assets/logo.png';
import LocalStorageService from '../services/localStorageService';

const ACCENT_NAV_STYLES = {
  blue: {
    navDark: 'bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-blue-950/95 border-white/10',
    navLight: 'bg-gradient-to-r from-gray-900/95 via-violet-950/95 to-blue-950/95 border-slate-700/60',
    activeDesktopLink: 'text-blue-500',
    activeMobileLinkDark: 'text-blue-400 bg-gray-800',
    activeMobileLinkLight: 'text-blue-700 bg-blue-100',
    avatarBg: 'bg-blue-600/20 border-blue-500/30',
    avatarIcon: 'text-blue-400',
    ctaGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
  },
  emerald: {
    navDark: 'bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-blue-950/95 border-white/10',
    navLight: 'bg-gradient-to-r from-gray-900/95 via-emerald-950/95 to-teal-950/95 border-slate-700/60',
    activeDesktopLink: 'text-emerald-500',
    activeMobileLinkDark: 'text-emerald-300 bg-gray-800',
    activeMobileLinkLight: 'text-emerald-700 bg-emerald-100',
    avatarBg: 'bg-emerald-600/20 border-emerald-500/30',
    avatarIcon: 'text-emerald-400',
    ctaGradient: 'bg-gradient-to-r from-emerald-600 to-teal-600',
  },
  rose: {
    navDark: 'bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-blue-950/95 border-white/10',
    navLight: 'bg-gradient-to-r from-gray-900/95 via-rose-950/95 to-pink-950/95 border-slate-700/60',
    activeDesktopLink: 'text-rose-500',
    activeMobileLinkDark: 'text-rose-300 bg-gray-800',
    activeMobileLinkLight: 'text-rose-700 bg-rose-100',
    avatarBg: 'bg-rose-600/20 border-rose-500/30',
    avatarIcon: 'text-rose-400',
    ctaGradient: 'bg-gradient-to-r from-rose-600 to-pink-600',
  },
  amber: {
    navDark: 'bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-blue-950/95 border-white/10',
    navLight: 'bg-gradient-to-r from-gray-900/95 via-amber-950/95 to-orange-950/95 border-slate-700/60',
    activeDesktopLink: 'text-amber-500',
    activeMobileLinkDark: 'text-amber-300 bg-gray-800',
    activeMobileLinkLight: 'text-amber-700 bg-amber-100',
    avatarBg: 'bg-amber-600/20 border-amber-500/30',
    avatarIcon: 'text-amber-400',
    ctaGradient: 'bg-gradient-to-r from-amber-600 to-orange-600',
  },
  violet: {
    navDark: 'bg-gradient-to-r from-slate-950/95 via-slate-900/95 to-blue-950/95 border-white/10',
    navLight: 'bg-gradient-to-r from-gray-900/95 via-violet-950/95 to-fuchsia-950/95 border-slate-700/60',
    activeDesktopLink: 'text-violet-500',
    activeMobileLinkDark: 'text-violet-300 bg-gray-800',
    activeMobileLinkLight: 'text-violet-700 bg-violet-100',
    avatarBg: 'bg-violet-600/20 border-violet-500/30',
    avatarIcon: 'text-violet-400',
    ctaGradient: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
  },
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [accent, setAccent] = useState(() => LocalStorageService.getDashboardAccent());
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, getDashboardPath, updateProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dashboardPath = getDashboardPath();
  const isDark = theme === 'dark';
  const isPortfolioPage = location.pathname.startsWith('/portfolio/');
  const accentStyles = ACCENT_NAV_STYLES[accent] || ACCENT_NAV_STYLES.blue;

  useEffect(() => {
    const applyAccent = (nextAccent) => {
      setAccent(nextAccent || LocalStorageService.getDashboardAccent());
    };

    const handleAccentEvent = (event) => {
      applyAccent(event?.detail?.accent);
    };

    const handleStorage = (event) => {
      if (event.key === 'devportix_dashboard_accent') {
        applyAccent(event.newValue);
      }
    };

    window.addEventListener('devportix:accent-changed', handleAccentEvent);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('devportix:accent-changed', handleAccentEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    // { name: 'Features', path: '/#features' },
    // { name: 'Projects', path: '/#projects' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Community', path: '/community' },
    { name: 'Contact', path: '/contact' },
  ];
  const portfolioNavLinks = [
    { name: 'Hero', path: '#hero' },
    { name: 'Projects', path: '#projects' },
    { name: 'Skills', path: '#skills' },
    { name: 'Timeline', path: '#timeline' },
    { name: 'Certifications', path: '#certifications' },
    { name: 'Contact', path: '#contact' },
  ];
  const currentNavLinks = isPortfolioPage ? portfolioNavLinks : navLinks;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const getProfileMenuKey = () => {
    const role = String(user?.role || '').toLowerCase();
    if (role === 'student') return { storageKey: 'student', menuKey: 'profile' };
    if (role === 'instructor') return { storageKey: 'instructor', menuKey: 'profile' };
    if (role === 'professional') return { storageKey: 'professional', menuKey: 'profile' };
    if (role === 'organization') return { storageKey: 'organization', menuKey: 'profile' };
    return null;
  };

  const handleProfileNavigation = async () => {
    if (!isAuthenticated) return;

    const profileMenu = getProfileMenuKey();
    if (!profileMenu) {
      navigate(dashboardPath);
      setIsOpen(false);
      return;
    }

    try {
      await updateProfile({
        dashboardMenu: {
          ...(user?.dashboardMenu || {}),
          [profileMenu.storageKey]: profileMenu.menuKey,
        },
      });
    } catch {
      // Navigate anyway even if persistence fails.
    }

    navigate(dashboardPath);
    setIsOpen(false);
  };

  const handleLinkClick = (path) => {
    setIsOpen(false);
    if (path.startsWith('/#')) {
      // Handle hash navigation
      const element = document.getElementById(path.substring(2));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    if (path.startsWith('#')) {
      const element = document.getElementById(path.substring(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className={`navbar-theme-preserve sticky top-0 w-full backdrop-blur-lg z-50 border-b ${
        isDark
          ? accentStyles.navDark
          : accentStyles.navLight
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[5rem]">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              to={isPortfolioPage ? location.pathname : '/'}
              className="flex items-center space-x-2"
              onClick={() => setIsOpen(false)}
              aria-label="Go to the DevPortix home page"
            >
              <div className="flex flex-col justify-between items-center group cursor-pointer">
                <div>
                  <img src={logo} alt="DEVPORTIX Logo" className="w-28 h-auto lg:w-40" />
                </div>
                {!isPortfolioPage && (
                  <span className={`mt-1 text-xs sm:text-sm group-hover:text-violet-300 ${isDark ? 'text-white' : 'text-white/95'}`}>
                    ... your code, your story.
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {currentNavLinks.map((link) => (
                isPortfolioPage ? (
                  <button
                    key={link.name}
                    type="button"
                    onClick={() => handleLinkClick(link.path)}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      isDark ? 'text-gray-200 hover:text-white' : 'text-white hover:text-white'
                    }`}
                  >
                    {link.name}
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={(e) => {
                      if (link.path.startsWith('/#')) {
                        e.preventDefault();
                        handleLinkClick(link.path);
                      }
                    }}
                    className={`px-3 py-2 text-sm font-medium transition ${
                      location.pathname === (link.path.startsWith('/#') ? '/' : link.path) ||
                      location.hash === link.path.substring(1)
                        ? accentStyles.activeDesktopLink
                        : isDark
                          ? 'text-gray-200 hover:text-white'
                          : 'text-white hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              {!isPortfolioPage && isAuthenticated && (
                <Link
                  to={dashboardPath}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    location.pathname === dashboardPath
                      ? accentStyles.activeDesktopLink
                      : isDark
                        ? 'text-gray-200 hover:text-white'
                        : 'text-white hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Right side controls */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-transparent hover:bg-white/10 border border-white/10'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-white [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.95))]" strokeWidth={2.5} />
              )}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleProfileNavigation}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition hover:scale-105 ${accentStyles.avatarBg}`}
                    aria-label="Open profile in dashboard"
                    title="Open profile"
                  >
                    <User className={`w-4 h-4 ${accentStyles.avatarIcon}`} />
                  </button>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-white'}`}>
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium rounded-lg border transition flex items-center text-red-300 bg-red-900/20 hover:bg-red-900/30 border-red-800/30"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`px-4 py-2 text-sm font-medium transition flex items-center ${
                    isDark ? 'text-gray-200 hover:text-white' : 'text-white hover:text-white'
                  }`}
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className={`px-6 py-2 ${accentStyles.ctaGradient} rounded-lg text-white font-medium hover:opacity-90 transition`}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-transparent hover:bg-white/10 border border-white/10'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-white [filter:drop-shadow(0_0_1px_rgba(255,255,255,0.95))]" strokeWidth={2.5} />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`inline-flex items-center justify-center p-2 rounded-md focus:outline-none ${
                isDark
                  ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                  : 'text-white hover:text-white hover:bg-white/10'
              }`}
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className={`md:hidden border-b ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-950/95 border-slate-700/60'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {currentNavLinks.map((link) => (
              isPortfolioPage ? (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => {
                    handleLinkClick(link.path);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 text-base font-medium ${
                    isDark
                      ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                      : 'text-white hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </button>
              ) : (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={(e) => {
                    if (link.path.startsWith('/#')) {
                      e.preventDefault();
                      handleLinkClick(link.path);
                    }
                    setIsOpen(false);
                  }}
                  className={`block px-3 py-2 text-base font-medium ${
                    location.pathname === (link.path.startsWith('/#') ? '/' : link.path) ||
                    location.hash === link.path.substring(1)
                      ? (isDark ? accentStyles.activeMobileLinkDark : accentStyles.activeMobileLinkLight)
                      : isDark
                        ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                        : 'text-white hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.name}
                </Link>
              )
            ))}
            {!isPortfolioPage && isAuthenticated && (
              <Link
                to={dashboardPath}
                className={`block px-3 py-2 text-base font-medium ${
                  location.pathname === dashboardPath
                  ? (isDark ? accentStyles.activeMobileLinkDark : accentStyles.activeMobileLinkLight)
                  : isDark
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-white hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            {!isPortfolioPage && <div className={`pt-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-700/60'}`}>
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2">
                    <button
                      type="button"
                      onClick={handleProfileNavigation}
                      className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 border transition hover:scale-105 ${accentStyles.avatarBg}`}
                      aria-label="Open profile in dashboard"
                    >
                      <User className={`w-4 h-4 ${accentStyles.avatarIcon}`} />
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-white'}`}>
                        {user?.username}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-200'}`}>
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-base font-medium rounded-md text-red-300 hover:text-white hover:bg-red-900/20"
                  >
                    <LogOut className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    className={`flex items-center px-3 py-2 text-base font-medium rounded-md ${
                      isDark
                        ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                        : 'text-white hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn className="w-5 h-5 mr-3" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className={`block px-3 py-2 text-base font-medium text-center text-white ${accentStyles.ctaGradient} rounded-lg hover:opacity-90 transition`}
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
