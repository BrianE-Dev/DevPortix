import React from 'react';
import { Code, GitBranch, Layout, Shield, Users, Zap } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const FEATURES = [
  {
    icon: Code,
    title: 'Code Syntax Highlighting',
    eyebrow: 'Editor Craft',
    description: 'Beautiful syntax highlighting for 100+ programming languages out of the box.',
    accent: 'text-violet-300',
    iconSurface: 'bg-violet-500/10',
    glow: 'from-violet-500/16 via-transparent to-transparent',
    layout: 'featured',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    eyebrow: 'Performance',
    description: 'Optimized performance with instant loading and client-side rendering architecture.',
    accent: 'text-cyan-300',
    iconSurface: 'bg-sky-500/10',
    glow: 'from-cyan-500/16 via-transparent to-transparent',
    layout: 'compact',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    eyebrow: 'Protection',
    description: 'Enterprise-grade security with end-to-end encryption for all your source code.',
    accent: 'text-indigo-300',
    iconSurface: 'bg-indigo-500/10',
    glow: 'from-indigo-500/16 via-transparent to-transparent',
    layout: 'compact',
  },
  {
    icon: Layout,
    title: 'Customizable Themes',
    eyebrow: 'Workspace Style',
    description: 'Choose from 50+ professional themes or build your own with the design system.',
    accent: 'text-sky-300',
    iconSurface: 'bg-cyan-500/10',
    glow: 'from-sky-500/16 via-transparent to-transparent',
    layout: 'default',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    eyebrow: 'Shared Flow',
    description: 'Share projects and collaborate with teammates in a cleaner developer workspace.',
    accent: 'text-blue-300',
    iconSurface: 'bg-blue-500/10',
    glow: 'from-blue-500/16 via-transparent to-transparent',
    layout: 'default',
  },
  {
    icon: GitBranch,
    title: 'GitHub-Ready Proof',
    eyebrow: 'Portfolio Signal',
    description: 'Connect live repos and project evidence so your portfolio shows work, not just claims.',
    accent: 'text-sky-300',
    iconSurface: 'bg-sky-500/10',
    glow: 'from-sky-500/16 via-transparent to-transparent',
    layout: 'default',
  },
];

const Features = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const sectionClass = isDark
    ? 'app-dark-section'
    : 'bg-[linear-gradient(180deg,#e0f2fe_0%,#dbeafe_38%,#e9d5ff_100%)]';

  return (
    <section id="features" className={`${sectionClass} px-4 py-24 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Product Highlights
          </span>
          <h2 className={`mt-4 text-4xl font-bold sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>Powerful Features for Developers</h2>
          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Everything you need to showcase your skills and grow your career with our developer-centric toolkit.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:mt-18 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="landing-glass-blue-card landing-glass-card-features group relative rounded-[28px] p-8"
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${feature.glow} opacity-80 transition duration-300 group-hover:opacity-100`} />
                <div className="relative flex min-h-[280px] flex-col justify-between lg:min-h-[320px]">
                  <div className="flex items-start justify-between gap-4">
                    <span className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                      {feature.eyebrow}
                    </span>
                    <div className={`rounded-2xl ${feature.iconSurface} p-4 ${feature.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-10">
                    <h3 className={`max-w-[14rem] font-semibold leading-tight ${isDark ? 'text-white' : 'text-slate-950'} text-[1.75rem]`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-5 max-w-[18rem] text-base leading-8 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                      {feature.description}
                    </p>
                  </div>
                  <div className={`mt-10 flex items-center gap-3 text-sm ${isDark ? 'text-slate-200' : 'text-slate-600'}`}>
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-sky-300" />
                    Built to make technical work feel polished from the first interaction.
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
