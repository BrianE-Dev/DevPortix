import React from 'react';
import { Code, Layout, Shield, Users, Zap } from 'lucide-react';

const FEATURES = [
  {
    icon: Code,
    title: 'Code Syntax Highlighting',
    description: 'Beautiful syntax highlighting for 100+ programming languages out of the box.',
    accent: 'text-violet-300',
    iconSurface: 'bg-violet-500/10',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance with instant loading and client-side rendering architecture.',
    accent: 'text-cyan-300',
    iconSurface: 'bg-sky-500/10',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Enterprise-grade security with end-to-end encryption for all your source code.',
    accent: 'text-indigo-300',
    iconSurface: 'bg-indigo-500/10',
  },
  {
    icon: Layout,
    title: 'Customizable Themes',
    description: 'Choose from 50+ professional themes or build your own with the design system.',
    accent: 'text-sky-300',
    iconSurface: 'bg-cyan-500/10',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Share projects and collaborate with teammates in a cleaner developer workspace.',
    accent: 'text-blue-300',
    iconSurface: 'bg-blue-500/10',
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">Powerful Features for Developers</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
            Everything you need to showcase your skills and grow your career with our developer-centric toolkit.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="rounded-2xl border border-white/8 bg-slate-900/70 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.28)] transition duration-300 hover:border-white/15 hover:bg-slate-900/88"
              >
                <div className={`mb-6 inline-flex rounded-xl ${feature.iconSurface} p-3 ${feature.accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
