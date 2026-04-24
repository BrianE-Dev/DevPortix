import React, { useMemo, useState } from 'react';
import { ArrowRight, ChevronDown, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DEVPORTIX_EDITORIAL_BLOGS } from '../data/communityEditorial';
import { useTheme } from '../hooks/useTheme';

const formatDate = (value) => {
  if (!value) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const buildHighlights = (post) => {
  if (Array.isArray(post?.editorialMeta?.sections) && post.editorialMeta.sections.length > 0) {
    return post.editorialMeta.sections.slice(0, 3).map((section) => ({
      heading: section.heading,
      summary: Array.isArray(section.body) ? section.body[0] : '',
    }));
  }

  return [
    {
      heading: 'Overview',
      summary: post?.excerpt || post?.content || '',
    },
  ];
};

const BlogHighlights = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const posts = useMemo(
    () => DEVPORTIX_EDITORIAL_BLOGS.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [],
  );
  const [openPostId, setOpenPostId] = useState(posts[0]?.id || '');

  const sectionClass = isDark
    ? 'app-dark-section'
    : 'bg-[linear-gradient(180deg,#e9d5ff_0%,#dbeafe_38%,#eff6ff_100%)]';

  return (
    <section className={`${sectionClass} px-4 py-24 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            From The Blog
          </span>
          <h2 className={`mt-4 text-4xl font-bold sm:text-5xl ${isDark ? 'text-white' : 'text-slate-950'}`}>
            Blog highlights worth opening
          </h2>
          <p className={`mx-auto mt-5 max-w-2xl text-sm leading-7 sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Explore recent DevPortix editorials in a cleaner, skimmable format. Open a panel for the key idea, then jump into the full article when you want the full story.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <div className={`overflow-hidden rounded-[32px] border ${isDark ? 'border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(2,6,23,0.28)]' : 'border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(148,163,184,0.22)]'}`}>
            {posts.map((post, index) => {
              const isOpen = post.id === openPostId;
              const coverImage = post?.editorialMeta?.heroImage || post?.media?.url || '';

              return (
                <article
                  key={post.id}
                  className={`${index > 0 ? (isDark ? 'border-t border-white/10' : 'border-t border-slate-200/80') : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenPostId(post.id)}
                    className={`flex w-full items-start justify-between gap-5 px-5 py-5 text-left transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50/80'}`}
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${isOpen ? 'bg-sky-500 text-white' : isDark ? 'bg-white/8 text-slate-300' : 'bg-sky-100 text-sky-700'}`}>
                        <Newspaper className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className={`flex flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>{post?.editorialMeta?.category || 'Editorial'}</span>
                          <span>{post?.editorialMeta?.readingTime || 'Read'}</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                        <h3 className={`mt-3 text-lg font-semibold leading-7 ${isDark ? 'text-white' : 'text-slate-950'}`}>
                          {post.title}
                        </h3>
                        <p className={`mt-2 max-w-2xl text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {post.excerpt}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`mt-1 h-5 w-5 shrink-0 transition ${isOpen ? 'rotate-180 text-sky-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                  </button>

                  {isOpen ? (
                    <div className="px-5 pb-6">
                      <div className={`grid gap-5 rounded-[26px] border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-slate-950/40' : 'border-slate-200 bg-slate-50/70'} lg:grid-cols-[220px_minmax(0,1fr)]`}>
                        <div className="overflow-hidden rounded-[22px]">
                          {coverImage ? (
                            <img
                              src={coverImage}
                              alt={post.title}
                              className="h-52 w-full object-cover"
                            />
                          ) : (
                            <div className={`flex h-52 items-center justify-center ${isDark ? 'bg-white/5 text-slate-400' : 'bg-white text-slate-400'}`}>
                              No image
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="grid gap-4">
                            {buildHighlights(post).map((highlight) => (
                              <div key={`${post.id}-${highlight.heading}`}>
                                <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
                                  {highlight.heading}
                                </p>
                                <p className={`mt-2 text-sm leading-7 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {highlight.summary}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6">
                            <Link
                              to={`/blog?post=${encodeURIComponent(post.id)}`}
                              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                            >
                              Read more
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className={`rounded-[32px] border p-6 sm:p-8 ${isDark ? 'border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white shadow-[0_24px_80px_rgba(2,6,23,0.28)]' : 'border-white/70 bg-[linear-gradient(145deg,#ffffff_0%,#eff6ff_52%,#e0f2fe_100%)] text-slate-900 shadow-[0_24px_80px_rgba(148,163,184,0.22)]'}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-sky-300' : 'text-sky-700'}`}>
              Editorial signal
            </p>
            <h3 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">
              The homepage now previews the thinking behind the product, not just the product itself.
            </h3>
            <p className={`mt-5 text-sm leading-8 sm:text-base ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              These articles cover portfolio strategy, hiring proof, systems thinking, and professional growth. The accordion keeps the section easy to scan while still giving each post enough room to feel substantial.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-[24px] border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>{posts.length}</p>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Featured posts surfaced</p>
              </div>
              <div className={`rounded-[24px] border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Accordion</p>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Expandable highlights, one post at a time</p>
              </div>
              <div className={`rounded-[24px] border px-4 py-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-950'}`}>Direct</p>
                <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Each item links straight to the full article</p>
              </div>
            </div>

            <div className={`mt-8 rounded-[26px] border p-5 ${isDark ? 'border-sky-400/20 bg-sky-500/10' : 'border-sky-200 bg-sky-50'}`}>
              <p className={`text-sm leading-7 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                TOTP is not used during registration. Signup now uses email verification links, while TOTP still works only for login after a user has verified their email and enabled authenticator-app protection.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogHighlights;
