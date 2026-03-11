import React, { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

const Testimonials = () => {
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const activeUsersRef = useRef(null);

  const testimonials = [
    {
      id: 1,
      name: 'Alex Chen',
      role: 'Senior Frontend Developer',
      company: 'TechCorp',
      content:
        'DevPort transformed how I showcase my work. The code syntax highlighting alone got me three interview calls!',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Full Stack Developer',
      company: 'StartupXYZ',
      content:
        'As someone with 50+ projects, organizing them was a nightmare. DevPort made it simple and beautiful.',
      avatar:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
    {
      id: 3,
      name: 'Marcus Rivera',
      role: 'DevOps Engineer',
      company: 'CloudSystems',
      content:
        'The GitHub integration saved me hours. My portfolio updates automatically with every commit!',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      rating: 5,
    },
  ];

  useEffect(() => {
    const target = 25000;
    const durationMs = 1600;
    const node = activeUsersRef.current;
    if (!node || hasAnimated) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || hasAnimated) return;

          setHasAnimated(true);
          const start = performance.now();

          const tick = (now) => {
            const progress = Math.min((now - start) / durationMs, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.floor(target * eased);
            setActiveUsersCount(value);

            if (progress < 1) {
              requestAnimationFrame(tick);
            }
          };

          requestAnimationFrame(tick);
          observer.disconnect();
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 rounded-full mb-4">
            <Quote className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-blue-300 font-medium">Testimonials</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">Loved by Developers</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See what developers are saying about their experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-blue-500/30 transition-all duration-300"
            >
              <div className="flex items-center mb-6">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4 object-cover"
                />
                <div>
                  <h4 className="font-semibold text-white">{testimonial.name}</h4>
                  <p className="text-sm text-gray-400">
                    {testimonial.role} - {testimonial.company}
                  </p>
                </div>
              </div>

              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>

              <blockquote className="text-gray-300 italic">"{testimonial.content}"</blockquote>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div ref={activeUsersRef} className="text-center">
            <div className="text-3xl font-bold text-white mb-2">{activeUsersCount.toLocaleString()}+</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
            <div className="text-gray-400">Average Rating</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">50+</div>
            <div className="text-gray-400">Countries</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">98%</div>
            <div className="text-gray-400">Satisfaction</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
