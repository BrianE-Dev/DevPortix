import React from 'react';
import { ArrowRight, GitBranch, Layers3, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

const SHOWCASE_CONTENT = {
  login: {
    eyebrow: 'Welcome Back',
    title: 'Pick up your portfolio story exactly where you left it.',
    description:
      'Review progress, ship updates, and keep every proof point in motion across your DevPortix workspace.',
    chips: ['Live portfolio updates', 'Proof-first storytelling', 'Progress you can show'],
    stats: [
      { label: 'Projects tracked', value: '100+' },
      { label: 'Signals surfaced', value: 'Commits, demos, and outcomes' },
    ],
    cards: [
      {
        title: 'Proof, not filler',
        text: 'Bring real project evidence into one clean portfolio flow.',
        icon: ShieldCheck,
      },
      {
        title: 'GitHub ready',
        text: 'Turn repositories and updates into signals hiring teams can scan fast.',
        icon: GitBranch,
      },
      {
        title: 'Momentum visible',
        text: 'Track growth over time instead of leaving your work frozen in one version.',
        icon: TrendingUp,
      },
    ],
  },
  signup: {
    eyebrow: 'Start Strong',
    title: 'Build a portfolio system that grows with your work.',
    description:
      'Create an account, verify your email, and move from raw projects to a polished DevPortix portfolio in one flow.',
    chips: ['Role-based onboarding', 'Email-secured signup', 'Portfolio + growth tracking'],
    stats: [
      { label: 'Setup time', value: 'Minutes, not weeks' },
      { label: 'Built for', value: 'Students, instructors, and professionals' },
    ],
    cards: [
      {
        title: 'Structured onboarding',
        text: 'Choose your role and start with the workflow that fits how you build.',
        icon: Layers3,
      },
      {
        title: 'Career-ready storytelling',
        text: 'Turn side projects, coursework, and shipped work into something employers understand.',
        icon: Sparkles,
      },
      {
        title: 'Designed for growth',
        text: 'Document learning, progress, and outcomes as your portfolio evolves.',
        icon: TrendingUp,
      },
    ],
  },
};

const AuthShowcase = ({ mode = 'login', isDark }) => {
  const content = SHOWCASE_CONTENT[mode] || SHOWCASE_CONTENT.login;

  return (
    <section
      className={`relative overflow-hidden rounded-[2rem] border p-8 sm:p-10 lg:min-h-[760px] ${
        isDark
          ? 'border-indigo-300/12 bg-[linear-gradient(155deg,rgba(15,23,42,0.98),rgba(30,27,75,0.97),rgba(49,46,129,0.92),rgba(67,56,202,0.38))] text-white'
          : 'border-violet-200 bg-[linear-gradient(155deg,rgba(250,245,255,0.98),rgba(237,233,254,0.98),rgba(221,214,254,0.96),rgba(196,181,253,0.9))] text-slate-900 shadow-[0_28px_80px_rgba(139,92,246,0.18)]'
      }`}
    >
      <div className={`absolute -top-12 left-10 h-36 w-36 rounded-full blur-3xl ${isDark ? 'bg-indigo-400/20' : 'bg-violet-300/60'}`} />
      <div className={`absolute bottom-8 right-6 h-44 w-44 rounded-full blur-3xl ${isDark ? 'bg-fuchsia-400/16' : 'bg-violet-400/45'}`} />

      <div className="relative flex h-full flex-col justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] backdrop-blur-sm animate-in slide-in-from-bottom duration-700 delay-100">
            <Sparkles className="h-4 w-4" />
            {content.eyebrow}
          </div>

          <h1 className="mt-6 max-w-xl text-4xl font-bold leading-tight sm:text-5xl animate-in slide-in-from-bottom duration-700 delay-300">
            {content.title}
          </h1>
          <p className={`mt-5 max-w-xl text-base leading-8 animate-in slide-in-from-bottom duration-700 delay-500 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {content.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3 animate-in slide-in-from-bottom duration-700 delay-700">
            {content.chips.map((chip) => (
              <span
                key={chip}
                className={`rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm ${
                  isDark ? 'border-white/10 bg-white/8 text-slate-100' : 'border-white/60 bg-white/70 text-slate-700'
                }`}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {content.stats.map((item, index) => (
              <div
                key={item.label}
                className={`rounded-[1.5rem] border p-5 backdrop-blur-md animate-in slide-in-from-bottom duration-700 ${
                  index === 0 ? 'delay-800' : 'delay-1000'
                } ${isDark ? 'border-white/10 bg-white/8' : 'border-white/60 bg-white/72'}`}
              >
                <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                <p className="mt-3 text-lg font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {content.cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className={`rounded-[1.5rem] border p-5 backdrop-blur-md animate-in slide-in-from-bottom duration-700 ${
                    index === 0 ? 'delay-700' : index === 1 ? 'delay-900' : 'delay-1000'
                  } ${isDark ? 'border-white/10 bg-white/8' : 'border-white/60 bg-white/72'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`rounded-2xl p-3 ${isDark ? 'bg-sky-400/12 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold">{card.title}</h2>
                      <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{card.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={`mt-8 inline-flex items-center gap-2 text-sm font-medium ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
          DevPortix keeps your code, growth, and story moving together.
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
};

export default AuthShowcase;
