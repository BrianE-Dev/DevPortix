import React from 'react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Image as ImageIcon } from 'lucide-react';
import { portfolioApi } from '../services/portfolioApi';

const accentClasses = {
  blue: 'text-blue-300 border-blue-400/40 bg-blue-500/10',
  emerald: 'text-emerald-300 border-emerald-400/40 bg-emerald-500/10',
  rose: 'text-rose-300 border-rose-400/40 bg-rose-500/10',
  amber: 'text-amber-300 border-amber-400/40 bg-amber-500/10',
  violet: 'text-violet-300 border-violet-400/40 bg-violet-500/10',
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

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <section className="bg-white/5 border border-white/10 rounded-xl p-8">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-3 py-1 text-xs rounded-full border ${accent}`}>DEVPORTIX Portfolio</span>
          </div>
          <h1 className="text-4xl font-bold text-white mt-4">{portfolio.displayName}</h1>
          <p className="text-lg text-gray-300 mt-2">{portfolio.headline}</p>
          <p className="text-gray-300 mt-4">{portfolio.bio}</p>
        </section>

        <section className="bg-white/5 border border-white/10 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4 inline-flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Screenshots
          </h2>
          {(portfolio.screenshots || []).length === 0 ? (
            <p className="text-gray-400">No screenshots added yet.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(portfolio.screenshots || []).map((item) => (
                <img key={item.id} src={item.dataUrl} alt={item.name} className="w-full h-44 object-cover rounded-lg border border-white/10" />
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
