import React from 'react';
import { Activity, BarChart3, Users, Zap } from 'lucide-react';

const Projects = () => {
  const analyticsCards = [
    {
      id: 1,
      label: 'Portfolio Views',
      value: '1.2M',
      trend: '+18% this month',
      description: 'Total public portfolio impressions across DEVPORTIX creators.',
      icon: BarChart3,
      color: 'from-blue-500/20 to-blue-700/20',
      iconColor: 'text-blue-300',
    },
    {
      id: 2,
      label: 'Mentorship Sessions',
      value: '84K',
      trend: '+11% this month',
      description: 'Instructor-led feedback sessions completed on the platform.',
      icon: Users,
      color: 'from-emerald-500/20 to-teal-700/20',
      iconColor: 'text-emerald-300',
    },
    {
      id: 3,
      label: 'Project Submissions',
      value: '320K',
      trend: '+24% this month',
      description: 'Student and instructor project updates submitted and reviewed.',
      icon: Activity,
      color: 'from-violet-500/20 to-fuchsia-700/20',
      iconColor: 'text-violet-300',
    },
    {
      id: 4,
      label: 'System Uptime',
      value: '99.98%',
      trend: 'Last 90 days',
      description: 'Reliable access for classrooms, instructors, and organizations.',
      icon: Zap,
      color: 'from-amber-500/20 to-orange-700/20',
      iconColor: 'text-amber-300',
    },
  ];

  return (
    <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-gray-900/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Platform Analytics
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Real-time growth and engagement metrics across the DEVPORTIX ecosystem
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          {analyticsCards.map((card) => (
            <div
              key={card.id}
              className={`bg-gradient-to-br ${card.color} backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-[1.02]`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-white">{card.label}</h3>
                <div className={`p-3 rounded-xl bg-white/10 ${card.iconColor}`}>
                  <card.icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mb-3">
                <div className="text-4xl font-bold text-white">{card.value}</div>
                <div className="text-sm text-emerald-300">{card.trend}</div>
              </div>

              <p className="text-gray-300 text-sm leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Projects;
