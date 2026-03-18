import React from 'react';
import { Activity, BarChart3, Users, Zap } from 'lucide-react';

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
  return (
    <section id="projects" className="bg-slate-950 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">Platform Analytics</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
            Real-time growth and engagement metrics across the DEVPORTIX ecosystem.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {ANALYTICS_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <article
                key={card.id}
                className="rounded-2xl border border-white/8 bg-slate-900/70 p-6 shadow-[0_18px_50px_rgba(2,6,23,0.28)] transition duration-300 hover:border-white/15 hover:bg-slate-900/88"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{card.label}</h3>
                    <div className="mt-5 text-4xl font-bold text-white">{card.value}</div>
                    <p className={`mt-2 text-xs font-medium ${card.trendAccent}`}>{card.trend}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${card.iconSurface} ${card.accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-300">{card.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Projects;
