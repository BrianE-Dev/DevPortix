import React from 'react';
import { Code, Layout, Shield, Users, Zap } from 'lucide-react';

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
];

const Features = () => {
  return (
    <section id="features" className="bg-slate-950 px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            Product Highlights
          </span>
          <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Powerful Features for Developers</h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            Everything you need to showcase your skills and grow your career with our developer-centric toolkit.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:mt-18 sm:grid-cols-2 xl:grid-cols-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            const isFeatured = feature.layout === 'featured';
            const isCompact = feature.layout === 'compact';
            const cardSizeClass = isFeatured
              ? 'xl:col-span-2 xl:row-span-2'
              : isCompact
                ? 'xl:min-h-[300px]'
                : 'xl:min-h-[340px]';

            return (
              <article
                key={feature.title}
                className={`landing-breathe-card group relative overflow-hidden rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] p-8 shadow-[0_22px_60px_rgba(2,6,23,0.3)] transition duration-300 hover:-translate-y-1 hover:border-white/15 ${cardSizeClass}`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${feature.glow} opacity-80 transition duration-300 group-hover:opacity-100`} />
                <div className={`relative flex flex-col ${isFeatured ? 'min-h-[420px] justify-between' : isCompact ? 'min-h-[260px]' : 'min-h-[320px]'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {feature.eyebrow}
                    </span>
                    <div className={`rounded-2xl ${feature.iconSurface} p-4 ${feature.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div className={isFeatured ? 'mt-14' : 'mt-10'}>
                    <h3 className={`font-semibold leading-tight text-white ${isFeatured ? 'max-w-[16rem] text-[2.1rem]' : 'max-w-[12rem] text-[1.75rem]'}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-5 text-slate-300 ${isFeatured ? 'max-w-[24rem] text-lg leading-8' : 'max-w-[15rem] text-base leading-8'}`}>
                      {feature.description}
                    </p>
                  </div>
                  {isFeatured && (
                    <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-violet-300" />
                      Built to make technical work feel polished from the first interaction.
                    </div>
                  )}
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
