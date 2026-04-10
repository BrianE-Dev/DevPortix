import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Footer = () => {
  return (
    <footer className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(15,23,42,0.94),rgba(30,64,175,0.2),rgba(49,46,129,0.26))]">
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
            <p className="text-sm text-gray-300">
              Build beautiful developer portfolios that tell your story.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a href="#" className="text-gray-300 hover:text-white" aria-label="Visit DevPortix on GitHub">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white" aria-label="Visit DevPortix on Twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-300 hover:text-white" aria-label="Visit DevPortix on LinkedIn">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Features</a></li>
              <li><Link to="/pricing" className="text-sm text-gray-300 hover:text-white">Pricing</Link></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Templates</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">API</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-gray-300 hover:text-white">About</Link></li>
              <li><Link to="/contact" className="text-sm text-gray-300 hover:text-white">Contact</Link></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Careers</a></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="text-sm text-gray-300 hover:text-white">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-8 text-center">
          <p className="text-sm text-gray-300">
            Copyright {new Date().getFullYear()} DEVPORTIX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
