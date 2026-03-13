import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Image as ImageIcon, Star } from 'lucide-react';
import { portfolioApi } from '../services/portfolioApi';
import { getDashboardAccent } from '../utils/dashboardAccent';

const accentClasses = {
  blue: 'text-blue-300 border-blue-400/40 bg-blue-500/10',
  emerald: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10',
  rose: 'text-rose-300 border-rose-400/40 bg-rose-500/10',
  amber: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  violet: 'text-violet-300 border-violet-400/40 bg-violet-500/10',
};

const accentBackgrounds = {
  blue: {
    page: 'from-slate-950 via-blue-950/40 to-slate-950',
    glowA: 'bg-blue-500/15',
    glowB: 'bg-cyan-400/10',
    gridTint: 'rgba(59,130,246,0.10)',
  },
  emerald: {
    page: 'from-slate-950 via-emerald-950/40 to-slate-950',
    glowA: 'bg-emerald-500/15',
    glowB: 'bg-teal-400/10',
    gridTint: 'rgba(16,185,129,0.10)',
  },
  rose: {
    page: 'from-slate-950 via-rose-950/40 to-slate-950',
    glowA: 'bg-rose-500/15',
    glowB: 'bg-pink-400/10',
    gridTint: 'rgba(244,63,94,0.10)',
  },
  amber: {
    page: 'from-slate-950 via-amber-950/35 to-slate-950',
    glowA: 'bg-amber-500/15',
    glowB: 'bg-orange-400/10',
    gridTint: 'rgba(245,158,11,0.10)',
  },
  violet: {
    page: 'from-slate-950 via-violet-950/45 to-slate-950',
    glowA: 'bg-violet-500/15',
    glowB: 'bg-fuchsia-400/10',
    gridTint: 'rgba(139,92,246,0.10)',
  },
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

  if (loading) {
    return (
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <p className="text-gray-300">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-xl p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Portfolio not found</h1>
          <p className="text-gray-300 mt-2">This portfolio has not been created yet.</p>
        </div>
      </div>
    );
  }

  const accent = accentClasses[portfolio.accent] || accentClasses.blue;
  const activeAccent = getDashboardAccent(portfolio.accent || 'blue');
  const themedBackground = accentBackgrounds[portfolio.accent] || accentBackgrounds.blue;

  return (
    <div className={`relative overflow-hidden min-h-screen bg-gradient-to-b ${themedBackground.page} pt-24 pb-20 px-4 sm:px-6 lg:px-8`}>
      <div className="pointer-events-none absolute inset-0">
        <div className={`absolute -top-24 -left-20 h-72 w-72 rounded-full blur-3xl ${themedBackground.glowA}`} />
        <div className={`absolute bottom-0 right-0 h-80 w-80 rounded-full blur-3xl ${themedBackground.glowB}`} />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(${themedBackground.gridTint} 1px, transparent 1px), linear-gradient(90deg, ${themedBackground.gridTint} 1px, transparent 1px)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto space-y-6">
        <section id="hero" className="bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-3 py-1 text-xs rounded-full border ${accent}`}>DEVPORTIX Portfolio</span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">{portfolio.heroIntro?.title || portfolio.displayName}</h1>
              <p className="text-sm text-gray-400 mt-1">@{portfolio.username}</p>
            </div>
            <div className="shrink-0">
              {portfolio.ownerAvatar ? (
                <img
                  src={portfolio.ownerAvatar}
                  alt={`${portfolio.ownerFullName || portfolio.username} profile`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-semibold text-white">
                  {(portfolio.ownerFullName || portfolio.displayName || portfolio.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-300 mt-2">{portfolio.heroIntro?.subtitle || portfolio.headline}</p>
          <p className="text-gray-300 mt-3">{portfolio.heroIntro?.summary || ''}</p>
          <div className="mt-4 flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <Star
                key={level}
                className={`w-5 h-5 text-yellow-400 ${level <= (Number(portfolio.experienceLevel) || 1) ? 'fill-current' : ''}`}
              />
            ))}
            <span className="text-sm text-gray-300">{Number(portfolio.experienceLevel) || 1}/5 experience</span>
          </div>
          <p className="text-gray-300 mt-4">{portfolio.bio || 'No bio added yet.'}</p>
          <div id="skills" className="mt-4">
            <h3 className="text-sm font-semibold text-white">Skills</h3>
            {(portfolio.skills || []).length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {(portfolio.skills || []).map((skill) => (
                  <span key={skill} className="px-3 py-1 text-xs rounded-full border border-white/20 bg-white/10 text-gray-100">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-sm mt-2">No skills added yet.</p>
            )}
          </div>
        </section>

        <section id="projects" className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Projects</h2>
          {(portfolio.projects || []).length === 0 ? (
            <p className="text-gray-400">No projects added yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {(portfolio.projects || []).map((item) => (
                <article key={item.id} className="border border-white/10 rounded-lg p-4 bg-black/20">
                  <h3 className="text-white font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-300 mt-1">{item.description}</p>
                  {item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className={`text-sm mt-2 inline-block ${activeAccent.linkClass}`}>
                      View project
                    </a>
                  )}
                  {(item.stack || []).length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.stack || []).map((tech) => (
                        <span key={tech} className="px-2 py-1 text-xs rounded-full border border-white/20 bg-white/10 text-gray-100">
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

        <section id="timeline" className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Timeline</h2>
          {(portfolio.timeline || []).length === 0 ? (
            <p className="text-gray-400">No timeline entries yet.</p>
          ) : (
            <div className="space-y-3">
              {(portfolio.timeline || []).map((item) => (
                <article key={item.id} className="border border-white/10 rounded-lg p-4 bg-black/20">
                  <p className="text-white font-semibold">{item.title}</p>
                  <p className="text-sm text-gray-300">{item.organization}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.startDate} - {item.endDate || 'Present'}</p>
                  {item.description && <p className="text-sm text-gray-300 mt-2">{item.description}</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="certifications" className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Certifications</h2>
          {(portfolio.certifications || []).length === 0 ? (
            <p className="text-gray-400">No certifications added yet.</p>
          ) : (
            <div className="space-y-3">
              {(portfolio.certifications || []).map((item) => (
                <article key={item.id} className="border border-white/10 rounded-lg p-4 bg-black/20">
                  <p className="text-white font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-300">{item.issuer}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.issueDate}</p>
                  {item.credentialUrl && (
                    <a href={item.credentialUrl} target="_blank" rel="noreferrer" className={`text-sm mt-2 inline-block ${activeAccent.linkClass}`}>
                      View credential
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="contact" className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Contact</h2>
          {portfolio.contact?.email || portfolio.contact?.phone || portfolio.contact?.location || portfolio.contact?.website ? (
            <div className="space-y-2 text-gray-300">
              {portfolio.contact?.email && <p>Email: {portfolio.contact.email}</p>}
              {portfolio.contact?.phone && <p>Phone: {portfolio.contact.phone}</p>}
              {portfolio.contact?.location && <p>Location: {portfolio.contact.location}</p>}
              {portfolio.contact?.website && (
                <p>
                  Website:{' '}
                  <a href={portfolio.contact.website} target="_blank" rel="noreferrer" className={activeAccent.linkClass}>
                    {portfolio.contact.website}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400">No contact details added yet.</p>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4 inline-flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Screenshots
          </h2>
          {(portfolio.screenshots || []).length === 0 ? (
            <p className="text-gray-400">No screenshots added yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {(portfolio.screenshots || []).map((item) => (
                <img
                  key={item.id}
                  src={item.dataUrl}
                  alt={item.name}
                  className="w-36 h-24 object-cover rounded-lg border border-white/10"
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Code Snippets</h2>
          {(portfolio.codeSnippets || []).length === 0 ? (
            <p className="text-gray-400">No code snippets added yet.</p>
          ) : (
            <div className="space-y-4">
              {(portfolio.codeSnippets || []).map((snippet) => (
                <article key={snippet.id} className="border border-white/10 rounded-lg p-4 bg-black/20">
                  <p className="text-white font-medium">{snippet.title} <span className="text-gray-400">({snippet.language})</span></p>
                  <pre className="mt-2 text-sm text-gray-200 whitespace-pre-wrap overflow-x-auto">{snippet.code}</pre>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4 inline-flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents
          </h2>
          {(portfolio.documents || []).length === 0 ? (
            <p className="text-gray-400">No documents added yet.</p>
          ) : (
            <div className="space-y-2">
              {(portfolio.documents || []).map((doc) => (
                <a
                  key={doc.id}
                  href={doc.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block px-4 py-3 rounded-lg border border-white/10 bg-black/20 text-white hover:bg-black/30 transition"
                >
                  {doc.name}
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PortfolioPage;
