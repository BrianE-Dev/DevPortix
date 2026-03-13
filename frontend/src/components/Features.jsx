import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Code, Zap, Shield, Layout, Users } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Code Syntax Highlighting",
      description: "Beautiful syntax highlighting for 100+ programming languages"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Optimized performance with instant loading and rendering"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Enterprise-grade security with end-to-end encryption"
    },
    {
      icon: <Layout className="w-8 h-8" />,
      title: "Customizable Themes",
      description: "Choose from 50+ themes or create your own"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Team Collaboration",
      description: "Share projects and collaborate with team members"
    }
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = Math.max(features.length - 1, 0);

  const slideTrack = (direction) => {
    setCurrentIndex((prev) => {
      if (direction === 'left') return Math.max(prev - 1, 0);
      return Math.min(prev + 1, maxIndex);
    });
  };

  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-950">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Powerful Features for Developers
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to showcase your skills and grow your career
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden pb-2">
          <div className="absolute inset-y-0 left-0 right-0 z-10 flex items-center justify-between pointer-events-none px-1 sm:px-2">
            <button
              type="button"
              onClick={() => slideTrack('left')}
              className="pointer-events-auto p-3 rounded-full border border-white/20 bg-slate-900/80 hover:bg-slate-800 transition"
              aria-label="Scroll features left"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <button
              type="button"
              onClick={() => slideTrack('right')}
              className="pointer-events-auto p-3 rounded-full border border-white/20 bg-slate-900/80 hover:bg-slate-800 transition"
              aria-label="Scroll features right"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div
            className="flex flex-nowrap gap-6 transition-transform duration-500 ease-out"
            style={{ transform: `translateX(calc(-${currentIndex} * (320px + 1.5rem)))` }}
          >
            {features.map((feature, index) => (
              <div
                key={`${feature.title}-${index}`}
                className="shrink-0 w-[280px] sm:w-[320px] min-h-[210px] bg-slate-900/80 rounded-xl p-6 h-full border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]"
              >
                <div className="text-cyan-300 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-slate-100 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-200/90">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
