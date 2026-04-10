import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Quote, Star } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Alisha Hester',
    role: 'PM, HubSpot',
    company: 'Freddi',
    content: 'The clean presentation helped me explain my experience faster and with more confidence.',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
    rating: 5,
  },
  {
    id: 2,
    name: 'Rich Wilson',
    role: 'COO, CommanderAI',
    company: 'Gov Regulatory Agency',
    content: 'We sped up our workflow quickly. The layout feels premium and still stays practical.',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    rating: 5,
  },
  {
    id: 3,
    name: 'Annie Stanley',
    role: 'Designer',
    company: 'Catalog',
    content: 'The portfolio flow is simple, elegant, and much easier to keep updated over time.',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80',
    rating: 5,
  },
  {
    id: 4,
    name: 'Johnny Bell',
    role: 'PM, Shopify',
    company: 'Makerworks',
    content: 'It feels polished without being heavy. That balance made a huge difference for our team.',
    avatar:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    rating: 5,
  },
  {
    id: 5,
    name: 'Marcus Rivera',
    role: 'DevOps Engineer',
    company: 'CloudSystems',
    content: 'The GitHub integration saved me hours. My portfolio updates automatically with every commit.',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    rating: 5,
  },
  {
    id: 6,
    name: 'Elena Brooks',
    role: 'Product Designer',
    company: 'Northgrid',
    content: 'The carousel, layout polish, and portfolio structure made the whole product feel far more premium.',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=800&q=80',
    rating: 5,
  },
];

const SLIDE_DURATION_MS = 7000;
const TARGET_STATS = {
  activeUsers: 15000,
  averageRating: 4.85,
  countries: 15,
  satisfaction: 100,
};

const INITIAL_STATS = {
  activeUsers: 0,
  averageRating: 0,
  countries: 0,
  satisfaction: 0,
};

const formatCount = (value) => `${Math.floor(value).toLocaleString()}+`;
const formatRating = (value) => `${value.toFixed(2)}/5`;
const formatCountries = (value) => `${Math.floor(value)}+`;
const formatSatisfaction = (value) => `${Math.round(value)}%`;

const Testimonials = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(INITIAL_STATS);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [stepSize, setStepSize] = useState(0);
  const [visibleCardCount, setVisibleCardCount] = useState(1);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);
  const activeUsersRef = useRef(null);
  const trackRef = useRef(null);
  const frameRef = useRef(null);
  const cycleStartedAtRef = useRef(performance.now());
  const hasIncrementedThisVisitRef = useRef(false);

  const carouselItems = useMemo(() => TESTIMONIALS, []);

  useEffect(() => {
    const measure = () => {
      const firstCard = trackRef.current?.querySelector('[data-testimonial-card="true"]');
      if (!firstCard) return;
      const nextStepSize = firstCard.getBoundingClientRect().width;
      const trackWidth = trackRef.current?.parentElement?.getBoundingClientRect().width || nextStepSize;
      setStepSize(nextStepSize);
      setVisibleCardCount(Math.max(1, Math.floor(trackWidth / nextStepSize)));
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const animateProgress = (now) => {
      const elapsed = now - cycleStartedAtRef.current;
      const nextProgress = Math.min(elapsed / SLIDE_DURATION_MS, 1);
      setProgress(nextProgress);

      if (nextProgress >= 1) {
        setActiveIndex((current) => {
          const maxStartIndex = Math.max(TESTIMONIALS.length - visibleCardCount, 0);
          if (current >= maxStartIndex) {
            setIsTransitionEnabled(false);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setIsTransitionEnabled(true));
            });
            return 0;
          }
          return current + 1;
        });
        cycleStartedAtRef.current = now;
        setProgress(0);
      }

      frameRef.current = requestAnimationFrame(animateProgress);
    };

    frameRef.current = requestAnimationFrame(animateProgress);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [visibleCardCount]);

  useEffect(() => {
    const node = activeUsersRef.current;
    if (!node || hasAnimated) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasIncrementedThisVisitRef.current) return;

          hasIncrementedThisVisitRef.current = true;
          setHasAnimated(true);

          const durationMs = 1600;
          const start = performance.now();

          const tick = (now) => {
            const progressValue = Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progressValue, 3);

            setStats({
              activeUsers: TARGET_STATS.activeUsers * eased,
              averageRating: TARGET_STATS.averageRating * eased,
              countries: TARGET_STATS.countries * eased,
              satisfaction: TARGET_STATS.satisfaction * eased,
            });

            if (progressValue < 1) {
              requestAnimationFrame(tick);
            } else {
              setStats(TARGET_STATS);
            }
          };

          requestAnimationFrame(tick);
          observer.disconnect();
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimated]);

  const currentProfile = TESTIMONIALS[activeIndex % TESTIMONIALS.length];
  const sectionClass = isDark
    ? 'bg-slate-950'
    : 'bg-[linear-gradient(180deg,#e0f2fe_0%,#dbeafe_40%,#e9d5ff_100%)]';

  return (
    <section className={`${sectionClass} px-4 py-24 sm:px-6 lg:px-8`}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <span className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Social Proof
          </span>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-gradient-to-br from-white/6 to-white/[0.03] p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2">
                <Quote className="h-4 w-4 text-violet-300" />
                <span className="text-sm font-medium text-violet-200">Testimonials</span>
              </div>
              <h2 className="mt-5 text-3xl font-bold text-white sm:text-4xl">
                Don&apos;t just take our word for it
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300 sm:text-base">
                Hear from some amazing developers and teams who are shipping faster with DevPortix.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              Now showing: <span className="font-medium text-white">{currentProfile.name}</span>
            </div>
          </div>

          <div className="mt-8 overflow-hidden">
            <div
              ref={trackRef}
              className={`flex ${isTransitionEnabled ? 'transition-transform duration-1000 ease-out' : ''}`}
              style={{ transform: `translateX(-${activeIndex * stepSize}px)` }}
            >
              {carouselItems.map((testimonial, index) => (
                <article
                  key={`${testimonial.id}-${index}`}
                  data-testimonial-card="true"
                  className="group relative min-h-[280px] min-w-[240px] overflow-hidden rounded-[26px] border border-white/12 bg-slate-900/70 shadow-[0_20px_60px_rgba(2,6,23,0.28)] sm:min-w-[250px] lg:min-w-[265px] xl:min-w-[280px]"
                >
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />

                  <div className="absolute inset-x-3 bottom-3 rounded-[22px] border border-white/15 bg-white/12 p-4 backdrop-blur-xl">
                    <div className="flex gap-1">
                      {Array.from({ length: testimonial.rating }).map((_, starIndex) => (
                        <Star
                          key={`${testimonial.id}-star-${starIndex}`}
                          className="h-3.5 w-3.5 fill-current text-amber-400"
                        />
                      ))}
                    </div>
                    <h4 className="mt-3 text-sm font-semibold text-white">{testimonial.name}</h4>
                    <p className="mt-1 text-[11px] text-slate-200">
                      {testimonial.role} {' - '} {testimonial.company}
                    </p>
                    <blockquote className="mt-3 text-sm leading-6 text-slate-100/95">
                      "{testimonial.content}"
                    </blockquote>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 transition-[width] duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 md:grid-cols-4">
          <div ref={activeUsersRef} className="text-center">
            <div className="text-3xl font-bold text-white">{formatCount(stats.activeUsers)}</div>
            <div className="mt-2 text-sm text-slate-300">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{formatRating(stats.averageRating)}</div>
            <div className="mt-2 text-sm text-slate-300">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{formatCountries(stats.countries)}</div>
            <div className="mt-2 text-sm text-slate-300">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white">{formatSatisfaction(stats.satisfaction)}</div>
            <div className="mt-2 text-sm text-slate-300">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
