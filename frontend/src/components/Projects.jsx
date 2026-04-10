import React from 'react';
import { Activity, BarChart3, Users, Zap } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const ANALYTICS_CARDS = [
  {
    id: 1,
    label: 'Portfolio Views',
    value: '1.2M',
    trend: '+18% this month',
    description: 'Total public portfolio impressions across DEVPORTIX creators.',
    icon: BarChart3,
    accent: 'text-blue-300',
    trendAccent: 'text-blue-300',
    iconSurface: 'bg-blue-500/10',
  },
  {
    id: 2,
    label: 'Mentorship Sessions',
    value: '84K',
    trend: '+11% this month',
    description: 'Instructor-led feedback sessions completed on the platform.',
    icon: Users,
    accent: 'text-emerald-300',
    trendAccent: 'text-emerald-300',
    iconSurface: 'bg-emerald-500/10',
  },
  {
    id: 3,
    label: 'Project Submissions',
    value: '320K',
    trend: '+24% this month',
    description: 'Student and instructor project updates submitted and reviewed.',
    icon: Activity,
    accent: 'text-violet-300',
    trendAccent: 'text-violet-300',
    iconSurface: 'bg-violet-500/10',
  },
  {
    id: 4,
    label: 'System Uptime',
    value: '99.98%',
    trend: 'Last 90 days',
    description: 'Reliable access for classrooms, instructors, and organizations.',
    icon: Zap,
    accent: 'text-amber-300',
    trendAccent: 'text-amber-300',
    iconSurface: 'bg-amber-500/10',
  },
];

const Projects = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const sectionClass = isDark
    ? 'bg-slate-950'
    : 'bg-[linear-gradient(180deg,#e0f2fe_0%,#dbeafe_42%,#e9d5ff_100%)]';

  return (
    <section id="projects" className={`${sectionClass} px-4 py-24 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Live Metrics
          </span>
          <h2 className={`mt-4 text-4xl font-bold sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>Platform Analytics</h2>
          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Real-time growth and engagement metrics across the DEVPORTIX ecosystem.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {ANALYTICS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                className="landing-glass-blue-card rounded-[28px] p-7"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className={`text-[15px] font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{card.label}</h3>
                    <div className={`mt-6 text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>{card.value}</div>
                    <p className={`mt-3 text-sm font-medium ${card.trendAccent}`}>{card.trend}</p>
                  </div>
                  <div className={`rounded-2xl p-4 ${card.iconSurface} ${card.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className={`mt-8 max-w-[18rem] text-base leading-8 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
