import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { useTheme } from '../hooks/useTheme';

const Footer = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const footerBackground = isDark
    ? 'linear-gradient(to right, rgba(2, 6, 23, 0.95), rgba(15, 23, 42, 0.95), rgba(23, 37, 84, 0.95))'
    : 'linear-gradient(to right, rgba(17, 24, 39, 0.95), rgba(46, 16, 101, 0.95), rgba(23, 37, 84, 0.95))';

  return (
    <footer
      className={`footer-theme-preserve footer-force-white border-t ${
        isDark
          ? 'border-white/10'
          : 'border-slate-700/60'
      }`}
      style={{ backgroundImage: footerBackground, color: '#ffffff' }}
    >
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 text-center md:grid-cols-4 md:text-left">
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <Link
              to="/"
              className="flex items-center space-x-2 justify-center md:justify-start"
              aria-label="Go to the DevPortix home page"
            >
              <BrandLogo className="h-9 w-auto max-w-[11rem]" alt="DevPortix logo" />
            </Link>
            <p className="text-sm text-white" style={{ color: '#ffffff' }}>
              Build beautiful developer portfolios that tell your story.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a href="#" className="text-white transition hover:text-white" style={{ color: '#ffffff' }} aria-label="Visit DevPortix on GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-white transition hover:text-white" style={{ color: '#ffffff' }} aria-label="Visit DevPortix on Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-white transition hover:text-white" style={{ color: '#ffffff' }} aria-label="Visit DevPortix on LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white" style={{ color: '#ffffff' }}>Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Features</a></li>
              <li><Link to="/pricing" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Pricing</Link></li>
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Templates</a></li>
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white" style={{ color: '#ffffff' }}>Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>About</Link></li>
              <li><Link to="/contact" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Contact</Link></li>
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Blog</a></li>
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Careers</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white" style={{ color: '#ffffff' }}>Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Terms of Service</a></li>
              <li><a href="#" className="text-sm text-white transition hover:text-white" style={{ color: '#ffffff' }}>Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className={`mt-8 pt-8 text-center ${isDark ? 'border-t border-white/10' : 'border-t border-slate-700/60'}`}>
          <p className="text-sm text-white" style={{ color: '#ffffff' }}>
            Copyright {new Date().getFullYear()} DEVPORTIX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
