import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, FileText, Image as ImageIcon, Plus, QrCode, Save, Trash2 } from 'lucide-react';
import { getDashboardAccent } from '../utils/dashboardAccent';
import LocalStorageService from '../services/localStorageService';
import { portfolioApi } from '../services/portfolioApi';

const ACCENTS = [
  { key: 'blue', label: 'Ocean Blue', chip: 'bg-blue-500', ring: 'ring-blue-400' },
  { key: 'emerald', label: 'Emerald', chip: 'bg-emerald-500', ring: 'ring-emerald-400' },
  { key: 'rose', label: 'Rose', chip: 'bg-rose-500', ring: 'ring-rose-400' },
  { key: 'amber', label: 'Amber', chip: 'bg-amber-500', ring: 'ring-amber-400' },
  { key: 'violet', label: 'Violet', chip: 'bg-violet-500', ring: 'ring-violet-400' },
];

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const PortfolioBuilder = ({ portfolio, onUpdate, accentClass = 'text-blue-300' }) => {
  const [snippetTitle, setSnippetTitle] = useState('');
  const [snippetLanguage, setSnippetLanguage] = useState('javascript');
  const [snippetCode, setSnippetCode] = useState('');
  const [error, setError] = useState('');
  const [shareAssets, setShareAssets] = useState(null);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState('');
  const [copied, setCopied] = useState(false);
  const publicPath = useMemo(() => `/portfolio/${portfolio?.slug || portfolio?.username || ''}`, [portfolio]);
  const activeAccent = getDashboardAccent(portfolio?.accent || 'blue');
  const headingAccentClass = accentClass || activeAccent.textClass;

  useEffect(() => {
    setShareAssets(null);
    setShareError('');
    setCopied(false);
  }, [portfolio?.slug, portfolio?.username]);

  if (!portfolio) return null;

  const fetchShareAssets = async () => {
    const token = LocalStorageService.getToken();
    if (!token) throw new Error('Login session not found.');

    const response = await portfolioApi.getShareAssets(token);
    setShareAssets(response);
    setShareError('');
    return response;
  };

  const ensureShareAssets = async () => {
    if (shareAssets?.shareUrl) return shareAssets;
    return fetchShareAssets();
  };

  const copyShareLink = async () => {
    try {
      const assets = await ensureShareAssets();
      await navigator.clipboard.writeText(assets.shareUrl);
      setCopied(true);
      setShareError('');
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setShareError('Unable to copy portfolio link right now.');
    }
  };

  const generateQrCode = async () => {
    try {
      setShareBusy(true);
      await fetchShareAssets();
    } catch {
      setShareError('Unable to generate QR code right now.');
    } finally {
      setShareBusy(false);
    }
  };

  const downloadQrCode = () => {
    if (!shareAssets?.qrCodeDataUrl) return;
    const anchor = document.createElement('a');
    anchor.href = shareAssets.qrCodeDataUrl;
    anchor.download = `${portfolio.slug || portfolio.username || 'portfolio'}-qrcode.png`;
    anchor.click();
  };

  const handleAccentChange = async (accent) => {
    try {
      await onUpdate({ accent });
      setError('');
    } catch {
      setError('Unable to save portfolio changes.');
    }
  };

  const handleUpload = async (event, kind) => {
    const fileList = Array.from(event.target.files || []);
    if (fileList.length === 0) return;

    const uploaded = await Promise.all(
      fileList.map(async (file) => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: await toDataUrl(file),
        uploadedAt: new Date().toISOString(),
      }))
    );

    if (kind === 'screenshots') {
      try {
        await onUpdate({ screenshots: [...(portfolio.screenshots || []), ...uploaded] });
      } catch {
        setError('Unable to upload screenshots right now.');
      }
    }

    if (kind === 'documents') {
      try {
        await onUpdate({ documents: [...(portfolio.documents || []), ...uploaded] });
      } catch {
        setError('Unable to upload documents right now.');
      }
    }

    event.target.value = '';
  };

  const removeItem = async (kind, id) => {
    const list = portfolio[kind] || [];
    try {
      await onUpdate({ [kind]: list.filter((item) => item.id !== id) });
      setError('');
    } catch {
      setError('Unable to remove item right now.');
    }
  };

  const handleSaveSnippet = async () => {
    if (!snippetCode.trim()) return;
    const nextSnippet = {
      id: crypto.randomUUID(),
      title: snippetTitle.trim() || 'Untitled snippet',
      language: snippetLanguage,
      code: snippetCode,
      updatedAt: new Date().toISOString(),
    };

    try {
      await onUpdate({ codeSnippets: [...(portfolio.codeSnippets || []), nextSnippet] });
      setSnippetTitle('');
      setSnippetLanguage('javascript');
      setSnippetCode('');
      setError('');
    } catch {
      setError('Unable to save snippet right now.');
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') || '').trim();
    const displayName = String(form.get('displayName') || '').trim();
    const headline = String(form.get('headline') || '').trim();
    const bio = String(form.get('bio') || '').trim();

    try {
      await onUpdate({
        username: username || portfolio.username,
        displayName: displayName || portfolio.displayName,
        headline,
        bio,
      });
      setError('');
    } catch {
      setError('Unable to save profile right now.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-semibold text-white">Portfolio Builder</h3>
            <p className="text-gray-300 text-sm mt-1">Default style matches DEVPORTIX. Customize accent and content below.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Open Portfolio
            </a>
            <button
              type="button"
              onClick={copyShareLink}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied' : 'Copy Link'}
            </button>
            <button
              type="button"
              onClick={generateQrCode}
              disabled={shareBusy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition disabled:opacity-70"
            >
              <QrCode className="w-4 h-4" />
              {shareBusy ? 'Generating...' : 'Generate QR'}
            </button>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-300">{error}</p>}
      {shareError && <p className="text-sm text-red-300">{shareError}</p>}

      {shareAssets?.qrCodeDataUrl && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
          <h4 className={`font-semibold ${headingAccentClass}`}>Portfolio QR Code</h4>
          <div className="mt-4 flex flex-col md:flex-row gap-4 md:items-center">
            <img
              src={shareAssets.qrCodeDataUrl}
              alt="Portfolio QR code"
              className="w-44 h-44 rounded-lg bg-white p-2 border border-white/20"
            />
            <div className="space-y-3">
              <p className="text-sm text-gray-300 break-all">{shareAssets.shareUrl}</p>
              <button
                type="button"
                onClick={downloadQrCode}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
              >
                <Download className="w-4 h-4" />
                Download QR
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleProfileSave} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Profile</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            name="displayName"
            defaultValue={portfolio.displayName || ''}
            placeholder="Display name"
            className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
          />
          <input
            name="username"
            defaultValue={portfolio.username || ''}
            placeholder="Username"
            className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
          />
        </div>
        <input
          name="headline"
          defaultValue={portfolio.headline || ''}
          placeholder="Headline"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
        />
        <textarea
          name="bio"
          defaultValue={portfolio.bio || ''}
          rows={3}
          placeholder="Bio"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
        />
        <button type="submit" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}>
          <Save className="w-4 h-4" />
          Save Profile
        </button>
      </form>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <h4 className={`font-semibold ${headingAccentClass}`}>Theme Accent</h4>
        <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACCENTS.map((accent) => {
            const isActive = portfolio.accent === accent.key;
            return (
              <button
                key={accent.key}
                type="button"
                onClick={() => handleAccentChange(accent.key)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border transition ${
                  isActive ? `border-white/50 ring-1 ${accent.ring} bg-white/10` : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="text-white text-sm">{accent.label}</span>
                <span className={`w-4 h-4 rounded-full ${accent.chip}`} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
          <h4 className={`font-semibold ${headingAccentClass}`}>Project Screenshots</h4>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white cursor-pointer hover:bg-white/20 transition">
            <ImageIcon className="w-4 h-4" />
            Upload Screenshots
            <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => handleUpload(event, 'screenshots')} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(portfolio.screenshots || []).map((item) => (
              <div key={item.id} className="relative border border-white/10 rounded-lg overflow-hidden bg-black/20">
                <img src={item.dataUrl} alt={item.name} className="w-full h-24 object-cover" />
                <button
                  type="button"
                  onClick={() => removeItem('screenshots', item.id)}
                  className="absolute top-2 right-2 p-1 rounded bg-black/60 text-white"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
          <h4 className={`font-semibold ${headingAccentClass}`}>PDF Files</h4>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white cursor-pointer hover:bg-white/20 transition">
            <FileText className="w-4 h-4" />
            Upload PDFs
            <input type="file" accept="application/pdf" multiple className="hidden" onChange={(event) => handleUpload(event, 'documents')} />
          </label>
          <div className="space-y-2">
            {(portfolio.documents || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-2">
                <a href={item.dataUrl} target="_blank" rel="noreferrer" className="text-sm text-white hover:underline">
                  {item.name}
                </a>
                <button
                  type="button"
                  onClick={() => removeItem('documents', item.id)}
                  className="p-1 rounded text-gray-200 hover:text-white"
                  aria-label={`Delete ${item.name}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Save Code Snippets</h4>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            value={snippetTitle}
            onChange={(event) => setSnippetTitle(event.target.value)}
            placeholder="Snippet title"
            className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
          />
          <select
            value={snippetLanguage}
            onChange={(event) => setSnippetLanguage(event.target.value)}
            className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="go">Go</option>
          </select>
          <button
            type="button"
            onClick={handleSaveSnippet}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
          >
            <Plus className="w-4 h-4" />
            Save Snippet
          </button>
        </div>
        <textarea
          value={snippetCode}
          onChange={(event) => setSnippetCode(event.target.value)}
          rows={8}
          placeholder="Paste your code here..."
          className="w-full font-mono text-sm px-3 py-2 rounded-lg border border-white/20 bg-black/30 text-white placeholder:text-gray-400"
        />
        <div className="space-y-3">
          {(portfolio.codeSnippets || []).map((snippet) => (
            <div key={snippet.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm">{snippet.title} <span className="text-gray-400">({snippet.language})</span></p>
                <button
                  type="button"
                  onClick={() => removeItem('codeSnippets', snippet.id)}
                  className="p-1 rounded text-gray-200 hover:text-white"
                  aria-label={`Delete ${snippet.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <pre className="mt-2 text-xs text-gray-200 overflow-x-auto whitespace-pre-wrap">{snippet.code}</pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioBuilder;
