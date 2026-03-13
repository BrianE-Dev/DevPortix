// src/components/Hero.jsx
import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  ChevronDownCircle,
  Play,
  Sparkles,
  X,
} from "lucide-react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useNavigate } from "react-router-dom";
import { codeExamples, floatingCards } from "../data/CodeExample";
import { useAuth } from "../hooks/useAuth";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("App.jsx");
  const [showDemo, setShowDemo] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, getDashboardPath, loading } = useAuth();

  useEffect(() => {
    let rafId;
    const handleMouseMove = (e) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const currentFloatingCards = floatingCards[activeTab];
  const demoGifUrl =
    "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExN3ZoN2x0dnhwNml4Ynd3ZjN4cHQ3NzYzd2JjZ2NlMWN4d3B2cG5xYiZlcD12MV9naWZzX3NlYXJjaCZjdD1n/13HgwGsXF0aiGY/giphy.gif";

  const handleStartBuilding = () => {
    if (loading) return;
    if (isAuthenticated) {
      navigate(getDashboardPath());
      return;
    }
    navigate("/signup");
  };
  
  return (
    <section className="hero-theme-preserve relative min-h-screen flex items-center justify-center pt-16 sm:pt-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Dynamic Mouse Follow Gradient */}
      <div
        className="absolute inset-0"
        style={{
          pointerEvents: "none",
          background: `radial-gradient(
            600px circle at ${mousePosition.x}px ${mousePosition.y}px,
            rgba(100,36,170,0.40) 0%,
            rgba(142,36,170,0) 40%)`,
        }}
      />
      
      {/* Animated Background Glows */}
      <div className="absolute top-20 left-4 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-4 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 bg-blue-400/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
          
          {/* Left Column - Text Content */}
          <div className="order-1 lg:order-1">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full mb-6 animate-in slide-in-from-bottom duration-1000">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-medium">
                Start telling your code story
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-in slide-in-from-bottom duration-500 delay-100">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-cyan-400 bg-clip-text text-transparent mb-2">
                Build a Developer Portfolio
              </span>
              <span className="block bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                That Tells Your Story
              </span>
            </h1>

            {/* Description */}
            <div className="mb-8">
              <p className="text-lg text-gray-300 mb-4 max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-bottom duration-700 delay-500">
                Document your growth by porting every line of your code into a 
                living </p> 
                <p className="text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-bottom duration-700 delay-1000">
                  portfolio—showcase meaningful projects and turn your work 
                into real career opportunities.</p>
              
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12 animate-in slide-in-from-bottom duration-700 delay-500">
              {/* Primary Button */}
              <button 
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 flex items-center justify-center space-x-3"
                aria-label="Start building portfolio"
                onClick={handleStartBuilding}
              >
                <span className="text-base">Start Building Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              {/* Secondary Button */}
              <button 
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:border-blue-500/50 flex items-center justify-center space-x-3"
                onClick={() => setShowDemo(true)}
              >
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Stats or Features */}
            <div className="grid grid-cols-3 gap-4 animate-in slide-in-from-bottom duration-700 delay-700">
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">100+</div>
                <div className="text-sm text-gray-400">Templates</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">Support</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl backdrop-blur-sm">
                <div className="text-2xl font-bold text-white">GitHub</div>
                <div className="text-sm text-gray-400">Integration</div>
              </div>
            </div>
          </div>

          {/* Right Column - Code Editor */}
          <div className="order-2 lg:order-2 w-full text-left">
            <div className="relative bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10">
              {/* Editor Container */}
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-sm rounded-xl overflow-hidden h-[350px] sm:h-[400px] lg:h-[450px] w-full border border-white/10">
                
                {/* IDE Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-900/80 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm font-medium text-gray-200">
                      DEVPORTIX
                    </span>
                  </div>
                  <ChevronDownCircle className="w-5 h-5 text-gray-400" />
                </div>

                {/* File Tabs */}
                <div className="flex space-x-2 px-4 pt-4 pb-2 border-b border-white/10 overflow-x-auto">
                  {["App.jsx", "Hero.jsx", "Navbar.jsx"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm rounded-t-lg transition-all duration-500 whitespace-nowrap ${
                        activeTab === tab
                          ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border-t border-x border-blue-400/20"
                          : "bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Code Display */}
                <div className="p-4 h-[calc(100%-88px)] text-left">
                  <SyntaxHighlighter
                    language="javascript"
                    style={atomOneDark}
                    customStyle={{
                      margin: 0,
                      padding: "1rem 1rem 1rem 1.25rem",
                      borderRadius: "0.5rem",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      height: "100%",
                      background: "transparent",
                      border: "1px solid #374151",
                      textAlign: "left"
                    }}
                    showLineNumbers={true}
                    wrapLines={true}
                  >
                    {codeExamples[activeTab]}
                  </SyntaxHighlighter>
                </div>
              </div>

              {/* Floating Info Card */}
              <div
                className={`hidden lg:block absolute -bottom-4 -right-4 transform w-80 ${currentFloatingCards.bgColor} backdrop-blur-xl rounded-xl p-5 border border-white/20 shadow-2xl transition-all duration-500`}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 ${currentFloatingCards.iconColor} rounded-lg flex items-center justify-center text-lg`}>
                    {currentFloatingCards.icon}
                  </div>
                  <span className={`text-lg font-semibold ${currentFloatingCards.textColor}`}>
                    {currentFloatingCards.title}
                  </span>
                </div>
                <p className={`text-sm ${currentFloatingCards.contentColor} leading-relaxed`}>
                  {currentFloatingCards.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDemo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white text-lg font-semibold">Sample Projects Demo</h3>
              <button
                type="button"
                onClick={() => setShowDemo(false)}
                className="p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Close demo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={demoGifUrl}
              alt="Sample developer projects demo"
              className="w-full h-auto max-h-[70vh] object-cover"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
