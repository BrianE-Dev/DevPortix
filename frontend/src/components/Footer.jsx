// src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Github, Twitter, Linkedin } from 'lucide-react';
// import logowhite from '../assets/logowhite.png'

const Footer = () => {
  return (
    <footer className="bg-gray-900/50 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
          {/* Brand */}
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <Link to="/" className="flex items-center space-x-2 justify-center md:justify-start">
              <div className="flex flex-col justify-between items-center group cursor-pointer">
              <p className='text-xl text-white '> DEVPORTIX </p>
              {/* <img src={logowhite} alt="Logo" className=" lg:w-32 lg:h-32 " /> */}
            
          </div>
            </Link>
            <p className="text-gray-400 text-sm">
              Build beautiful developer portfolios that tell your story.
            </p>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a href="#" className="text-gray-400 hover:text-white">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Features</a></li>
              <li><Link to="/pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Templates</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">API</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white text-sm">About</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} DEVPORTIX. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
