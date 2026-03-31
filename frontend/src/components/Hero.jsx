// src/components/Hero.jsx
import React, { useEffect, useRef, useState } from "react";
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
import { useTheme } from "../hooks/useTheme";
import demoVideo from "../assets/demo/DevP-Demo.mp4";
import BrandLogo from "./BrandLogo";

const Hero = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState("App.jsx");
  const [showDemo, setShowDemo] = useState(false);
  const demoVideoRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, getDashboardPath, loading } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";

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

  useEffect(() => {
    const tabs = ["App.jsx", "Hero.jsx", "Navbar.jsx"];
    const intervalId = window.setInterval(() => {
      setActiveTab((currentTab) => {
        const currentIndex = tabs.indexOf(currentTab);
        const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % tabs.length;
        return tabs[nextIndex];
      });
    }, 3200);

    return () => window.clearInterval(intervalId);
  }, []);

  const currentFloatingCards = floatingCards[activeTab];
  const floatingCardStyles = {
    "App.jsx": {
      background: "rgba(59, 130, 246, 0.2)",
      icon: "#60a5fa",
      title: "#bfdbfe",
      content: "#93c5fd",
      iconLabel: "AI",
    },
    "Hero.jsx": {
      background: "rgba(168, 85, 247, 0.2)",
      icon: "#c084fc",
      title: "#e9d5ff",
      content: "#d8b4fe",
      iconLabel: "⚡",
    },
    "Navbar.jsx": {
      background: "rgba(168, 85, 247, 0.2)",
      icon: "#34d399",
      title: "#a7f3d0",
      content: "#6ee7b7",
      iconLabel: "🔍",
    },
  };
  const currentFloatingCardStyle = floatingCardStyles[activeTab];

  useEffect(() => {
    if (!showDemo || !demoVideoRef.current) return;
    demoVideoRef.current.currentTime = 0;
    demoVideoRef.current.play().catch(() => {});
  }, [showDemo]);

  const handleCloseDemo = () => {
    if (demoVideoRef.current) {
      demoVideoRef.current.pause();
      demoVideoRef.current.currentTime = 0;
    }
    setShowDemo(false);
  };

  const handleStartBuilding = () => {
    if (loading) return;
    if (isAuthenticated) {
      navigate(getDashboardPath());
      return;
    }
    navigate("/signup");
  };

  const heroSectionClass = isDark
    ? "bg-gradient-to-br from-gray-900 via-black to-gray-900"
    : "bg-blue-100";
  const heroGlowPrimaryClass = isDark ? "bg-indigo-500/30" : "bg-blue-300/55";
  const heroGlowSecondaryClass = isDark ? "bg-blue-400/30" : "bg-cyan-300/45";
  const heroBadgeClass = isDark
    ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
    : "bg-white/85 border border-blue-200 shadow-[0_12px_30px_rgba(148,163,184,0.18)]";
  const heroBadgeIconClass = isDark ? "text-blue-400" : "text-blue-700";
  const heroBadgeTextClass = isDark ? "text-blue-300" : "text-slate-800";
  const heroDescriptionClass = isDark ? "text-gray-300" : "text-slate-700";
  const heroStatCardClass = isDark
    ? "bg-white/5"
    : "border border-slate-300/80 bg-white/70 shadow-[0_14px_36px_rgba(148,163,184,0.18)]";
  const heroStatNumberClass = isDark ? "text-white" : "text-slate-900";
  const heroStatTextClass = isDark ? "text-gray-300" : "text-slate-700";
  
  return (
    <section className={`hero-theme-preserve relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16 pb-28 sm:px-6 sm:pt-20 sm:pb-32 lg:px-8 ${heroSectionClass}`}>
      {/* Dynamic Mouse Follow Gradient */}
      <div
        className="absolute inset-0"
        style={{
          pointerEvents: "none",
          background: `radial-gradient(
            600px circle at ${mousePosition.x}px ${mousePosition.y}px,
            ${isDark ? "rgba(100,36,170,0.40)" : "rgba(59,130,246,0.14)"} 0%,
            rgba(142,36,170,0) 40%)`,
        }}
      />
      
      {/* Animated Background Glows */}
      <div className={`absolute top-20 left-4 sm:left-10 w-48 sm:w-72 h-48 sm:h-72 rounded-full blur-3xl animate-pulse ${heroGlowPrimaryClass}`}></div>
      <div className={`absolute bottom-20 right-4 sm:right-10 w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl animate-pulse delay-1000 ${heroGlowSecondaryClass}`}></div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto text-center relative w-full">
        <div className="max-w-7xl mx-auto flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
          
          {/* Left Column - Text Content */}
          <div className="order-1 lg:order-1">
            {/* Badge */}
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-6 animate-in slide-in-from-bottom duration-1000 ${heroBadgeClass}`}>
              <Sparkles className={`w-4 h-4 ${heroBadgeIconClass}`} />
              <span className={`text-sm font-medium ${heroBadgeTextClass}`}>
                Portfolio + Proof for Developers
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-in slide-in-from-bottom duration-500 delay-100">
              <span className="block bg-gradient-to-r from-white via-blue-100 to-cyan-400 bg-clip-text text-transparent mb-2">
                Prove Your Skills With a Developer 
              </span>
              <span className="block bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Portfolio That Gets You Hired
              </span>
            </h1>

            {/* Description */}
            <div className="mb-8">
              <p className={`text-lg ${heroDescriptionClass} mb-4 max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-bottom duration-700 delay-500`}>
               Turn your projects, progress, and real work into structured</p> 
                <p className={`text-lg ${heroDescriptionClass} max-w-2xl mx-auto lg:mx-0 animate-in slide-in-from-bottom duration-700 delay-700`}>
                  proof employers trust — all in one portfolio.</p>
              
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12 animate-in slide-in-from-bottom duration-700 delay-500">
              {/* Primary Button */}
              <button 
                className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 flex items-center justify-center space-x-3"
                aria-label="Start building portfolio"
                onClick={handleStartBuilding}
              >
                <span className="text-base">Create Your Portfolio</span>
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
              <div className={`rounded-2xl p-4 text-center backdrop-blur-sm ${heroStatCardClass}`}>
                <div className={`text-2xl font-bold ${heroStatNumberClass}`}>100+</div>
                <div className={`text-sm ${heroStatTextClass}`}>Templates</div>
              </div>
              <div className={`rounded-2xl p-4 text-center backdrop-blur-sm ${heroStatCardClass}`}>
                <div className={`text-2xl font-bold ${heroStatNumberClass}`}>24/7</div>
                <div className={`text-sm ${heroStatTextClass}`}>Support</div>
              </div>
              <div className={`rounded-2xl p-4 text-center backdrop-blur-sm ${heroStatCardClass}`}>
                <div className={`text-2xl font-bold ${heroStatNumberClass}`}>GitHub</div>
                <div className={`text-sm ${heroStatTextClass}`}>Integration</div>
              </div>
            </div>
          </div>

          {/* Right Column - Code Editor */}
          <div className="order-2 lg:order-2 w-full text-left">
            <div
              className="relative backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10"
              style={{
                background: "linear-gradient(to bottom right, rgba(17, 24, 39, 0.5), rgba(0, 0, 0, 0.5))",
              }}
            >
              {/* Editor Container */}
              <div
                className="backdrop-blur-sm rounded-xl overflow-hidden h-[350px] sm:h-[400px] lg:h-[450px] w-full border border-white/10"
                style={{
                  background: "linear-gradient(to bottom right, rgba(17, 24, 39, 0.8), rgba(31, 41, 55, 0.8))",
                }}
              >
                
                {/* IDE Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 backdrop-blur-sm border-b border-white/10"
                  style={{ backgroundColor: "rgba(17, 24, 39, 0.8)" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <BrandLogo className="h-5 w-auto max-w-[7rem]" alt="DevPortix logo" />
                  </div>
                  <ChevronDownCircle className="w-5 h-5" style={{ color: "rgb(156 163 175)" }} />
                </div>

                {/* File Tabs */}
                <div className="flex space-x-2 px-4 pt-4 pb-2 border-b border-white/10 overflow-x-auto">
                  {["App.jsx", "Hero.jsx", "Navbar.jsx"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="px-4 py-2 text-sm rounded-t-lg transition-all duration-500 whitespace-nowrap border-t border-x"
                      style={
                        activeTab === tab
                          ? {
                              background: "linear-gradient(to right, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3))",
                              color: "#ffffff",
                              borderColor: "rgba(96, 165, 250, 0.2)",
                            }
                          : {
                              backgroundColor: "rgba(31, 41, 55, 0.5)",
                              color: "rgb(156 163 175)",
                              borderColor: "transparent",
                            }
                      }
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
                className="hidden lg:block absolute -bottom-4 -right-4 transform w-80 backdrop-blur-xl rounded-xl p-5 border border-white/20 shadow-2xl transition-all duration-500"
                style={{ backgroundColor: currentFloatingCardStyle.background }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ color: currentFloatingCardStyle.icon }}
                  >
                    {currentFloatingCardStyle.iconLabel}
                  </div>
                  <span className="text-lg font-semibold" style={{ color: currentFloatingCardStyle.title }}>
                    {currentFloatingCards.title}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: currentFloatingCardStyle.content }}>
                  {currentFloatingCards.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-slate-950/60 to-slate-950" />

      {showDemo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white text-lg font-semibold">Sample Projects Demo</h3>
              <button
                type="button"
                onClick={handleCloseDemo}
                className="p-2 text-gray-300 hover:text-white transition-colors"
                aria-label="Close demo"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <video
              ref={demoVideoRef}
              src={demoVideo}
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto max-h-[70vh] bg-black"
            >
              Your browser does not support the demo video.
            </video>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
