import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import { portfolioApi } from '../services/portfolioApi';
import { getDashboardAccent } from '../utils/dashboardAccent';
import { resolveMediaUrl } from '../utils/api';

const accentThemes = {
  blue: {
    badge: 'border-cyan-300/35 bg-cyan-400/10 text-cyan-100',
    page: 'from-[#04101f] via-[#0d1f3c] to-[#07131f]',
    panel: 'border-white/10 bg-white/6',
    pill: 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100',
    glowA: 'bg-cyan-400/18',
    glowB: 'bg-blue-500/16',
    mesh: 'rgba(34,211,238,0.13)',
  },
  emerald: {
    badge: 'border-emerald-300/35 bg-emerald-400/10 text-emerald-100',
    page: 'from-[#04140f] via-[#0b2d24] to-[#05140f]',
    panel: 'border-white/10 bg-white/6',
    pill: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
    glowA: 'bg-emerald-400/18',
    glowB: 'bg-teal-500/16',
    mesh: 'rgba(52,211,153,0.13)',
  },
  rose: {
    badge: 'border-rose-300/35 bg-rose-400/10 text-rose-100',
    page: 'from-[#17060c] via-[#32101f] to-[#14050d]',
    panel: 'border-white/10 bg-white/6',
    pill: 'border-rose-300/25 bg-rose-400/10 text-rose-100',
    glowA: 'bg-rose-400/18',
    glowB: 'bg-pink-500/16',
    mesh: 'rgba(251,113,133,0.13)',
  },
  amber: {
    badge: 'border-amber-300/35 bg-amber-400/10 text-amber-100',
    page: 'from-[#170d04] via-[#39240d] to-[#170b03]',
    panel: 'border-white/10 bg-white/6',
    pill: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
    glowA: 'bg-amber-400/18',
    glowB: 'bg-orange-500/16',
    mesh: 'rgba(251,191,36,0.13)',
  },
  violet: {
    badge: 'border-violet-300/35 bg-violet-400/10 text-violet-100',
    page: 'from-[#100616] via-[#25103a] to-[#0d0614]',
    panel: 'border-white/10 bg-white/6',
    pill: 'border-violet-300/25 bg-violet-400/10 text-violet-100',
    glowA: 'bg-violet-400/18',
    glowB: 'bg-fuchsia-500/16',
    mesh: 'rgba(192,132,252,0.13)',
  },
};

const formatDate = (value) => {
  if (!value) return 'Date not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const PortfolioPage = () => {
  const { username } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadPortfolio = async () => {
      try {
        setLoading(true);
        const response = await portfolioApi.getPublic(username);
        if (mounted) {
          setPortfolio(response.portfolio);
        }
      } catch (_error) {
        if (mounted) {
          setPortfolio(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPortfolio();
    return () => {
      mounted = false;
    };
  }, [username]);

  const theme = useMemo(
    () => accentThemes[portfolio?.accent] || accentThemes.blue,
    [portfolio?.accent]
  );
  const activeAccent = useMemo(
    () => getDashboardAccent(portfolio?.accent || 'blue'),
    [portfolio?.accent]
  );
  const growthSummary = portfolio?.growthSummary || {
    totalItems: 0,
    assignmentsCount: 0,
    projectsCount: 0,
    submittedCount: 0,
    reviewedCount: 0,
    averageScore: null,
  };
  const growthRecords = Array.isArray(portfolio?.growthRecords) ? portfolio.growthRecords : [];
  const contactRows = [
    portfolio?.contact?.email
      ? { icon: Mail, label: 'Email', value: portfolio.contact.email, href: `mailto:${portfolio.contact.email}` }
      : null,
    portfolio?.contact?.phone
      ? { icon: Phone, label: 'Phone', value: portfolio.contact.phone, href: `tel:${portfolio.contact.phone}` }
      : null,
    portfolio?.contact?.location
      ? { icon: MapPin, label: 'Location', value: portfolio.contact.location }
      : null,
  ].filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-gray-300">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-slate-950 pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto rounded-[2rem] border border-white/10 bg-white/5 p-12 text-center">
          <h1 className="text-3xl font-bold text-white">Portfolio not found</h1>
          <p className="text-gray-300 mt-3">This portfolio has not been created yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${theme.page} px-4 pb-20 pt-24 sm:px-6 lg:px-8`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -left-20 top-4 h-80 w-80 rounded-full blur-3xl ${theme.glowA}`} />
        <div className={`absolute right-0 top-1/3 h-96 w-96 rounded-full blur-3xl ${theme.glowB}`} />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(${theme.mesh} 1px, transparent 1px), linear-gradient(90deg, ${theme.mesh} 1px, transparent 1px)`,
            backgroundSize: '42px 42px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-6">
        <section className={`overflow-hidden rounded-[2rem] border ${theme.panel} backdrop-blur-xl`}>
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-8 sm:p-10 lg:p-12">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${theme.badge}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  DevPortix Portfolio
                </span>
                {growthRecords.length > 0 && (
                  <a
                    href="#growth-monitor"
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] ${theme.pill}`}
                  >
                    See Growth Monitor
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-start gap-5">
                {portfolio.ownerAvatar ? (
                  <img
                    src={resolveMediaUrl(portfolio.ownerAvatar)}
                    alt={`${portfolio.ownerFullName || portfolio.username} profile`}
                    className="h-24 w-24 rounded-[1.75rem] border border-white/15 object-cover shadow-2xl"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-white/15 bg-white/10 text-3xl font-semibold text-white">
                    {(portfolio.ownerFullName || portfolio.displayName || portfolio.username || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                    {portfolio.heroIntro?.title || portfolio.displayName}
                  </h1>
                  <p className="mt-2 text-sm uppercase tracking-[0.28em] text-gray-400">@{portfolio.username}</p>
                  <p className="mt-4 max-w-3xl text-xl text-gray-200">
                    {portfolio.heroIntro?.subtitle || portfolio.headline}
                  </p>
                </div>
              </div>

              <p className="mt-6 max-w-3xl text-base leading-8 text-gray-300">
                {portfolio.heroIntro?.summary || portfolio.bio || 'No bio added yet.'}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Star
                      key={level}
                      className={`h-5 w-5 text-amber-300 ${level <= (Number(portfolio.experienceLevel) || 1) ? 'fill-current' : ''}`}
                    />
                  ))}
                  <span className="text-sm text-gray-300">{Number(portfolio.experienceLevel) || 1}/5 experience</span>
                </div>
                <a
                  href="#projects"
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white ${activeAccent.primaryButtonClass}`}
                >
                  View Projects
                </a>
                {portfolio.contact?.website && (
                  <a
                    href={portfolio.contact.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                  >
                    Visit Website
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div id="skills" className="mt-8 flex flex-wrap gap-2">
                {(portfolio.skills || []).length > 0 ? (
                  (portfolio.skills || []).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-gray-100"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No skills added yet.</p>
                )}
              </div>
            </div>

            <div className="border-t border-white/10 bg-black/20 p-8 sm:p-10 lg:border-l lg:border-t-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  {
                    label: 'Projects',
                    value: String((portfolio.projects || []).length),
                    detail: 'Case studies and product work',
                    icon: Trophy,
                  },
                  {
                    label: 'Reviewed Growth',
                    value: String(growthSummary.reviewedCount || 0),
                    detail: 'Assignments and projects scored by instructor',
                    icon: BarChart3,
                  },
                  {
                    label: 'Average Score',
                    value: Number.isFinite(growthSummary.averageScore) ? `${growthSummary.averageScore}%` : '--',
                    detail: 'Across reviewed growth items',
                    icon: Sparkles,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-gray-400">{item.label}</p>
                        <Icon className={`h-4 w-4 ${activeAccent.textClass}`} />
                      </div>
                      <p className="mt-4 text-3xl font-bold text-white">{item.value}</p>
                      <p className="mt-2 text-sm text-gray-300">{item.detail}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Contact</p>
                {contactRows.length > 0 || portfolio.contact?.website ? (
                  <div className="mt-4 space-y-3">
                    {contactRows.map((row) => {
                      const Icon = row.icon;
                      const content = (
                        <>
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10">
                            <Icon className="h-4 w-4 text-white" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs uppercase tracking-[0.24em] text-gray-500">{row.label}</span>
                            <span className="block truncate text-sm text-gray-100">{row.value}</span>
                          </span>
                        </>
                      );
                      return row.href ? (
                        <a key={row.label} href={row.href} className="flex items-center gap-3">
                          {content}
                        </a>
                      ) : (
                        <div key={row.label} className="flex items-center gap-3">
                          {content}
                        </div>
                      );
                    })}
                    {portfolio.contact?.website && (
                      <a
                        href={portfolio.contact.website}
                        target="_blank"
                        rel="noreferrer"
                        className={`inline-flex items-center gap-2 text-sm ${activeAccent.linkClass}`}
                      >
                        {portfolio.contact.website}
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-400">No contact details added yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {growthRecords.length > 0 && (
          <section id="growth-monitor" className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`text-xs uppercase tracking-[0.24em] ${activeAccent.textClass}`}>Growth Monitor</p>
                <h2 className="mt-3 text-3xl font-bold text-white">A public view of the student&apos;s progress</h2>
                <p className="mt-3 max-w-3xl text-gray-300">
                  This section highlights how the student is growing through instructor-led assignments and projects.
                </p>
              </div>
              <div className="grid min-w-[240px] grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Reviewed</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{growthSummary.reviewedCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Average</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {Number.isFinite(growthSummary.averageScore) ? `${growthSummary.averageScore}%` : '--'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {growthRecords.map((record) => (
                <article key={record.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${theme.pill}`}>
                          {record.typeLabel}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-gray-300">
                          {record.reviewStatus === 'reviewed' ? 'Reviewed' : 'In progress'}
                        </span>
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-white">{record.title}</h3>
                      <p className="mt-2 text-sm text-gray-300">{record.question}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-3 text-right">
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Score</p>
                      <p className="mt-2 text-2xl font-semibold text-white">
                        {Number.isFinite(record.score) ? `${record.score}%` : '--'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Instructor Feedback</p>
                      <p className="mt-3 text-sm text-gray-200">
                        {record.remark || 'Feedback will appear here after review.'}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-gray-400">Progress Info</p>
                      <p className="mt-3 text-sm text-gray-200">Instructor: {record.instructorName}</p>
                      <p className="mt-2 text-sm text-gray-300">Submitted: {record.submittedAt ? formatDate(record.submittedAt) : 'Not yet submitted'}</p>
                      <p className="mt-2 text-sm text-gray-300">Due: {formatDate(record.dueDate)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="projects" className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs uppercase tracking-[0.24em] ${activeAccent.textClass}`}>Projects</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Selected work</h2>
            </div>
          </div>
          {(portfolio.projects || []).length === 0 ? (
            <p className="mt-5 text-gray-400">No projects added yet.</p>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {(portfolio.projects || []).map((item) => (
                <article key={item.id} className="group rounded-[1.5rem] border border-white/10 bg-black/20 p-6 transition hover:-translate-y-1 hover:bg-black/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                      <p className="mt-3 text-sm leading-7 text-gray-300">{item.description}</p>
                    </div>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className={`inline-flex ${activeAccent.linkClass}`}>
                        <ArrowUpRight className="h-5 w-5" />
                      </a>
                    )}
                  </div>
                  {(item.stack || []).length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-2">
                      {(item.stack || []).map((tech) => (
                        <span key={tech} className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs text-gray-100">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section id="timeline" className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
            <h2 className="text-2xl font-bold text-white">Timeline</h2>
            {(portfolio.timeline || []).length === 0 ? (
              <p className="mt-5 text-gray-400">No timeline entries yet.</p>
            ) : (
              <div className="mt-8 space-y-4">
                {(portfolio.timeline || []).map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-lg font-semibold text-white">{item.title}</p>
                    <p className="mt-1 text-sm text-gray-300">{item.organization}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">
                      {item.startDate} - {item.endDate || 'Present'}
                    </p>
                    {item.description && <p className="mt-4 text-sm leading-7 text-gray-300">{item.description}</p>}
                  </article>
                ))}
              </div>
            )}
          </section>

          <section id="certifications" className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
            <h2 className="text-2xl font-bold text-white">Certifications</h2>
            {(portfolio.certifications || []).length === 0 ? (
              <p className="mt-5 text-gray-400">No certifications added yet.</p>
            ) : (
              <div className="mt-8 space-y-4">
                {(portfolio.certifications || []).map((item) => (
                  <article key={item.id} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                    <p className="text-lg font-semibold text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-gray-300">{item.issuer}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-gray-500">{item.issueDate}</p>
                    {item.credentialUrl && (
                      <a href={item.credentialUrl} target="_blank" rel="noreferrer" className={`mt-4 inline-flex items-center gap-2 text-sm ${activeAccent.linkClass}`}>
                        View credential
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-white">
              <ImageIcon className="h-5 w-5" />
              Screenshots
            </h2>
            {(portfolio.screenshots || []).length === 0 ? (
              <p className="mt-5 text-gray-400">No screenshots added yet.</p>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {(portfolio.screenshots || []).map((item) => (
                  <img
                    key={item.id}
                    src={item.dataUrl}
                    alt={item.name}
                    className="h-48 w-full rounded-[1.5rem] border border-white/10 object-cover"
                  />
                ))}
              </div>
            )}
          </section>

          <section className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
            <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-white">
              <FileText className="h-5 w-5" />
              Documents
            </h2>
            {(portfolio.documents || []).length === 0 ? (
              <p className="mt-5 text-gray-400">No documents added yet.</p>
            ) : (
              <div className="mt-8 space-y-3">
                {(portfolio.documents || []).map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.dataUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-[1.25rem] border border-white/10 bg-black/20 px-5 py-4 text-white transition hover:bg-black/30"
                  >
                    <span>{doc.name}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className={`rounded-[2rem] border ${theme.panel} p-8 sm:p-10 backdrop-blur-xl`}>
          <h2 className="text-2xl font-bold text-white">Code Snippets</h2>
          {(portfolio.codeSnippets || []).length === 0 ? (
            <p className="mt-5 text-gray-400">No code snippets added yet.</p>
          ) : (
            <div className="mt-8 space-y-4">
              {(portfolio.codeSnippets || []).map((snippet) => (
                <article key={snippet.id} className="rounded-[1.5rem] border border-white/10 bg-[#020617]/70 p-5">
                  <p className="text-lg font-semibold text-white">
                    {snippet.title} <span className="text-sm text-gray-400">({snippet.language})</span>
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/40 p-4 text-sm text-gray-200 whitespace-pre-wrap">
                    {snippet.code}
                  </pre>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PortfolioPage;
