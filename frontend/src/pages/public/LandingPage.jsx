import Hero from '../../components/Hero';

const featureCards = [
  {
    icon: '01',
    title: 'Build Fast',
    description: 'Create your portfolio in minutes',
  },
  {
    icon: '02',
    title: 'Role-Based',
    description: 'Tailored experience for each user',
  },
  {
    icon: '03',
    title: 'Professional',
    description: 'Showcase to employers and peers',
  },
];

const LandingPage = () => {
  return (
    <div>
      <Hero />
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-3">
          {featureCards.map((card) => (
            <div key={card.title} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-sky-700">
                {card.icon}
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-5xl rounded-[2rem] border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 px-6 py-8 text-white shadow-xl md:px-10 md:py-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.1fr)_320px] md:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-300">Recruiter Section</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                View insights and analytics of ready portfolios and resumes
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 md:text-base">
                Recruiters can quickly review polished candidate portfolios, scan resume strength, and spot high-signal work through a cleaner analytics view.
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Portfolio Insights</p>
                <p className="mt-2 text-sm text-white">See which portfolios are complete, current, and ready for hiring review.</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-sky-200">Resume Analytics</p>
                <p className="mt-2 text-sm text-white">Compare resume readiness, proof of work, and practical project depth in one place.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
