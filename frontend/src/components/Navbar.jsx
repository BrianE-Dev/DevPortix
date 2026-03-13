import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import logo from '../assets/logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated, getDashboardPath } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const dashboardPath = getDashboardPath();
  const isDark = theme === 'dark';

  const navLinks = [
    { name: 'Home', path: '/' },
    // { name: 'Features', path: '/#features' },
    // { name: 'Projects', path: '/#projects' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Community', path: '/community' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
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
  };

  return (
    <nav
      className={`navbar-theme-preserve sticky top-0 w-full backdrop-blur-lg z-50 border-b ${
        isDark ? 'bg-gradient-to-r from-gray-800 from-10% via-violet-950 via-30% to-blue-950 to-90% ... border-gray-200' : ' bg-gradient-to-r from-gray-800 from-10% via-violet-950 via-30% to-blue-950 to-90% ... border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[5rem]">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2" onClick={() => setIsOpen(false)}>
              <div className="flex flex-col justify-between items-center group cursor-pointer">
                <div>
                  <img src={logo} alt="DEVPORTIX Logo" className="w-28 h-10 lg:w-40 lg:h-12" />
                </div>
                <span className={`text-xs mt-1 sm:text-sm group-hover:text-cyan-600 ${isDark ? 'text-white/90' : 'text-white/90'}`}>
                  <p> ... your code, your story.</p>
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-6">
              {navLinks.map((link) => (
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
                      ? 'text-blue-500'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {isAuthenticated && (
                <Link
                  to={dashboardPath}
                  className={`px-3 py-2 text-sm font-medium transition ${
                    location.pathname === dashboardPath
                      ? 'text-blue-500'
                      : 'text-gray-300 hover:text-white'
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
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center border border-blue-500/30">
                    <User className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
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
                  className="px-4 py-2 text-sm font-medium transition flex items-center text-gray-300 hover:text-white"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-white font-medium hover:opacity-90 transition"
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
                isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md focus:outline-none text-gray-400 hover:text-white hover:bg-gray-800"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-b bg-gray-900 border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
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
                    ? 'text-blue-400 bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                to={dashboardPath}
                className={`block px-3 py-2 text-base font-medium ${
                  location.pathname === dashboardPath
                    ? 'text-blue-400 bg-gray-800'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            )}
            <div className="pt-4 border-t border-gray-800">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-8 h-8 bg-blue-600/20 rounded-full flex items-center justify-center mr-3 border border-blue-500/30">
                      <User className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {user?.username}
                      </p>
                      <p className="text-xs text-gray-400">
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
                    className="flex items-center px-3 py-2 text-base font-medium rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn className="w-5 h-5 mr-3" />
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block px-3 py-2 text-base font-medium text-center text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:opacity-90 transition"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
