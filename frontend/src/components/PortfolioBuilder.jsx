import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, ExternalLink, FileText, Image as ImageIcon, Plus, QrCode, Save, Star, Trash2 } from 'lucide-react';
import { getDashboardAccent } from '../utils/dashboardAccent';
import LocalStorageService from '../services/localStorageService';
import { portfolioApi } from '../services/portfolioApi';
import { useModal } from '../hooks/useModal';

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
  const [bioDraft, setBioDraft] = useState('');
  const [experienceLevelDraft, setExperienceLevelDraft] = useState(1);
  const [heroIntroDraft, setHeroIntroDraft] = useState({ title: '', subtitle: '', summary: '' });
  const [portfolioSkillInput, setPortfolioSkillInput] = useState('');
  const [editingPortfolioSkill, setEditingPortfolioSkill] = useState('');
  const [editingPortfolioSkillValue, setEditingPortfolioSkillValue] = useState('');
  const [projectDraft, setProjectDraft] = useState({ title: '', description: '', link: '', stackText: '' });
  const [editingProjectId, setEditingProjectId] = useState('');
  const [timelineDraft, setTimelineDraft] = useState({
    title: '',
    organization: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [editingTimelineId, setEditingTimelineId] = useState('');
  const [certificationDraft, setCertificationDraft] = useState({
    name: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
  });
  const [editingCertificationId, setEditingCertificationId] = useState('');
  const [contactDraft, setContactDraft] = useState({
    email: '',
    phone: '',
    location: '',
    website: '',
  });
  const { showSuccess, showError: showErrorModal, confirm } = useModal();
  const publicPath = useMemo(() => `/portfolio/${portfolio?.slug || portfolio?.username || ''}`, [portfolio]);
  const activeAccent = getDashboardAccent(portfolio?.accent || 'blue');
  const headingAccentClass = accentClass || activeAccent.textClass;

  useEffect(() => {
    setShareAssets(null);
    setShareError('');
    setCopied(false);
  }, [portfolio?.slug, portfolio?.username]);

  useEffect(() => {
    setBioDraft(portfolio?.bio || '');
    setExperienceLevelDraft(Number(portfolio?.experienceLevel) || 1);
    setHeroIntroDraft({
      title: portfolio?.heroIntro?.title || '',
      subtitle: portfolio?.heroIntro?.subtitle || '',
      summary: portfolio?.heroIntro?.summary || '',
    });
    setContactDraft({
      email: portfolio?.contact?.email || '',
      phone: portfolio?.contact?.phone || '',
      location: portfolio?.contact?.location || '',
      website: portfolio?.contact?.website || '',
    });
    setEditingProjectId('');
    setEditingTimelineId('');
    setEditingCertificationId('');
    setEditingPortfolioSkill('');
    setEditingPortfolioSkillValue('');
    setProjectDraft({ title: '', description: '', link: '', stackText: '' });
    setTimelineDraft({ title: '', organization: '', startDate: '', endDate: '', description: '' });
    setCertificationDraft({ name: '', issuer: '', issueDate: '', credentialUrl: '' });
  }, [portfolio?.bio, portfolio?.experienceLevel, portfolio?.heroIntro, portfolio?.contact]);

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
      showSuccess('Theme Updated', 'Portfolio accent has been updated.');
    } catch {
      setError('Unable to save portfolio changes.');
      showErrorModal('Update Failed', 'Unable to save portfolio changes.');
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
        showSuccess('Upload Complete', 'Screenshots uploaded successfully.');
      } catch {
        setError('Unable to upload screenshots right now.');
        showErrorModal('Upload Failed', 'Unable to upload screenshots right now.');
      }
    }

    if (kind === 'documents') {
      try {
        await onUpdate({ documents: [...(portfolio.documents || []), ...uploaded] });
        showSuccess('Upload Complete', 'Documents uploaded successfully.');
      } catch {
        setError('Unable to upload documents right now.');
        showErrorModal('Upload Failed', 'Unable to upload documents right now.');
      }
    }

    event.target.value = '';
  };

  const removeItem = async (kind, id) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Item?',
      message: 'Are you sure you want to delete this item?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    const list = portfolio[kind] || [];
    try {
      await onUpdate({ [kind]: list.filter((item) => item.id !== id) });
      setError('');
      showSuccess('Item Removed', 'Portfolio item deleted successfully.');
    } catch {
      setError('Unable to remove item right now.');
      showErrorModal('Delete Failed', 'Unable to remove item right now.');
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
      showSuccess('Snippet Saved', 'Code snippet added to your portfolio.');
    } catch {
      setError('Unable to save snippet right now.');
      showErrorModal('Save Failed', 'Unable to save snippet right now.');
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = String(form.get('username') || '').trim();
    const displayName = String(form.get('displayName') || '').trim();
    const headline = String(form.get('headline') || '').trim();
    try {
      await onUpdate({
        username: username || portfolio.username,
        displayName: displayName || portfolio.displayName,
        headline,
      });
      setError('');
      showSuccess('Profile Updated', 'Profile details updated successfully.');
    } catch {
      setError('Unable to save profile right now.');
      showErrorModal('Update Failed', 'Unable to save profile right now.');
    }
  };

  const handleSaveBio = async () => {
    try {
      await onUpdate({
        bio: bioDraft.trim(),
        experienceLevel: experienceLevelDraft,
      });
      setError('');
      showSuccess('Bio Updated', 'Your bio and experience level were saved.');
    } catch {
      setError('Unable to save bio right now.');
      showErrorModal('Save Failed', 'Unable to save bio right now.');
    }
  };

  const handleDeleteBio = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Bio?',
      message: 'This will remove your bio and reset experience level to 1 star.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await onUpdate({
        bio: '',
        experienceLevel: 1,
      });
      setBioDraft('');
      setExperienceLevelDraft(1);
      setError('');
      showSuccess('Bio Deleted', 'Your bio was deleted successfully.');
    } catch {
      setError('Unable to delete bio right now.');
      showErrorModal('Delete Failed', 'Unable to delete bio right now.');
    }
  };

  const handleSaveHeroIntro = async () => {
    try {
      await onUpdate({
        heroIntro: {
          title: heroIntroDraft.title.trim(),
          subtitle: heroIntroDraft.subtitle.trim(),
          summary: heroIntroDraft.summary.trim(),
        },
      });
      showSuccess('Hero Intro Updated', 'Hero intro section saved successfully.');
    } catch {
      showErrorModal('Save Failed', 'Unable to save hero intro right now.');
    }
  };

  const handleDeleteHeroIntro = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Hero Intro?',
      message: 'This will clear your hero intro content.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (!isConfirmed) return;

    try {
      await onUpdate({ heroIntro: { title: '', subtitle: '', summary: '' } });
      setHeroIntroDraft({ title: '', subtitle: '', summary: '' });
      showSuccess('Hero Intro Deleted', 'Hero intro section cleared.');
    } catch {
      showErrorModal('Delete Failed', 'Unable to delete hero intro right now.');
    }
  };

  const handleAddPortfolioSkill = async () => {
    const nextSkill = portfolioSkillInput.trim();
    if (!nextSkill) return;
    const existingSkills = Array.isArray(portfolio.skills) ? portfolio.skills : [];
    if (existingSkills.some((skill) => skill.toLowerCase() === nextSkill.toLowerCase())) {
      setPortfolioSkillInput('');
      return;
    }

    try {
      await onUpdate({ skills: [...existingSkills, nextSkill] });
      setPortfolioSkillInput('');
      showSuccess('Skill Added', 'Skill added to portfolio.');
    } catch {
      showErrorModal('Save Failed', 'Unable to add skill right now.');
    }
  };

  const startEditPortfolioSkill = (skill) => {
    setEditingPortfolioSkill(skill);
    setEditingPortfolioSkillValue(skill);
  };

  const handleSaveEditedPortfolioSkill = async () => {
    const updatedSkill = editingPortfolioSkillValue.trim();
    if (!editingPortfolioSkill || !updatedSkill) return;
    const existingSkills = Array.isArray(portfolio.skills) ? portfolio.skills : [];
    const nextSkills = existingSkills.map((skill) => (skill === editingPortfolioSkill ? updatedSkill : skill));
    const deduped = [...new Set(nextSkills.map((skill) => String(skill || '').trim()).filter(Boolean))];

    try {
      await onUpdate({ skills: deduped });
      setEditingPortfolioSkill('');
      setEditingPortfolioSkillValue('');
      showSuccess('Skill Updated', 'Skill updated successfully.');
    } catch {
      showErrorModal('Update Failed', 'Unable to update skill right now.');
    }
  };

  const handleDeletePortfolioSkill = async (skillToDelete) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Skill?',
      message: 'Are you sure you want to delete this skill?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    const existingSkills = Array.isArray(portfolio.skills) ? portfolio.skills : [];
    try {
      await onUpdate({ skills: existingSkills.filter((skill) => skill !== skillToDelete) });
      showSuccess('Skill Deleted', 'Skill removed from portfolio.');
    } catch {
      showErrorModal('Delete Failed', 'Unable to delete skill right now.');
    }
  };

  const handleSaveProjectSection = async () => {
    const title = projectDraft.title.trim();
    if (!title) return;
    const existingProjects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
    const nextProject = {
      id: editingProjectId || crypto.randomUUID(),
      title,
      description: projectDraft.description.trim(),
      link: projectDraft.link.trim(),
      stack: projectDraft.stackText
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };
    const nextProjects = editingProjectId
      ? existingProjects.map((item) => (item.id === editingProjectId ? nextProject : item))
      : [...existingProjects, nextProject];

    try {
      await onUpdate({ projects: nextProjects });
      setProjectDraft({ title: '', description: '', link: '', stackText: '' });
      setEditingProjectId('');
      showSuccess('Projects Updated', editingProjectId ? 'Project updated successfully.' : 'Project added successfully.');
    } catch {
      showErrorModal('Save Failed', 'Unable to save project right now.');
    }
  };

  const startEditProjectSection = (projectItem) => {
    setEditingProjectId(projectItem.id);
    setProjectDraft({
      title: projectItem.title || '',
      description: projectItem.description || '',
      link: projectItem.link || '',
      stackText: Array.isArray(projectItem.stack) ? projectItem.stack.join(', ') : '',
    });
  };

  const handleDeleteProjectSection = async (projectId) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Project?',
      message: 'Are you sure you want to delete this project entry?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    const existingProjects = Array.isArray(portfolio.projects) ? portfolio.projects : [];
    try {
      await onUpdate({ projects: existingProjects.filter((item) => item.id !== projectId) });
      if (editingProjectId === projectId) {
        setProjectDraft({ title: '', description: '', link: '', stackText: '' });
        setEditingProjectId('');
      }
      showSuccess('Project Deleted', 'Project removed from portfolio section.');
    } catch {
      showErrorModal('Delete Failed', 'Unable to delete project right now.');
    }
  };

  const handleSaveTimeline = async () => {
    const title = timelineDraft.title.trim();
    if (!title) return;
    const existingTimeline = Array.isArray(portfolio.timeline) ? portfolio.timeline : [];
    const nextItem = {
      id: editingTimelineId || crypto.randomUUID(),
      title,
      organization: timelineDraft.organization.trim(),
      startDate: timelineDraft.startDate.trim(),
      endDate: timelineDraft.endDate.trim(),
      description: timelineDraft.description.trim(),
    };
    const nextTimeline = editingTimelineId
      ? existingTimeline.map((item) => (item.id === editingTimelineId ? nextItem : item))
      : [...existingTimeline, nextItem];

    try {
      await onUpdate({ timeline: nextTimeline });
      setTimelineDraft({ title: '', organization: '', startDate: '', endDate: '', description: '' });
      setEditingTimelineId('');
      showSuccess('Timeline Updated', editingTimelineId ? 'Timeline item updated.' : 'Timeline item added.');
    } catch {
      showErrorModal('Save Failed', 'Unable to save timeline item right now.');
    }
  };

  const startEditTimeline = (timelineItem) => {
    setEditingTimelineId(timelineItem.id);
    setTimelineDraft({
      title: timelineItem.title || '',
      organization: timelineItem.organization || '',
      startDate: timelineItem.startDate || '',
      endDate: timelineItem.endDate || '',
      description: timelineItem.description || '',
    });
  };

  const handleDeleteTimeline = async (timelineId) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Timeline Item?',
      message: 'Are you sure you want to delete this timeline item?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    const existingTimeline = Array.isArray(portfolio.timeline) ? portfolio.timeline : [];
    try {
      await onUpdate({ timeline: existingTimeline.filter((item) => item.id !== timelineId) });
      if (editingTimelineId === timelineId) {
        setTimelineDraft({ title: '', organization: '', startDate: '', endDate: '', description: '' });
        setEditingTimelineId('');
      }
      showSuccess('Timeline Deleted', 'Timeline item removed.');
    } catch {
      showErrorModal('Delete Failed', 'Unable to delete timeline item right now.');
    }
  };

  const handleSaveCertification = async () => {
    const name = certificationDraft.name.trim();
    if (!name) return;
    const existingCertifications = Array.isArray(portfolio.certifications) ? portfolio.certifications : [];
    const nextItem = {
      id: editingCertificationId || crypto.randomUUID(),
      name,
      issuer: certificationDraft.issuer.trim(),
      issueDate: certificationDraft.issueDate.trim(),
      credentialUrl: certificationDraft.credentialUrl.trim(),
    };
    const nextCertifications = editingCertificationId
      ? existingCertifications.map((item) => (item.id === editingCertificationId ? nextItem : item))
      : [...existingCertifications, nextItem];

    try {
      await onUpdate({ certifications: nextCertifications });
      setCertificationDraft({ name: '', issuer: '', issueDate: '', credentialUrl: '' });
      setEditingCertificationId('');
      showSuccess('Certifications Updated', editingCertificationId ? 'Certification updated.' : 'Certification added.');
    } catch {
      showErrorModal('Save Failed', 'Unable to save certification right now.');
    }
  };

  const startEditCertification = (certificationItem) => {
    setEditingCertificationId(certificationItem.id);
    setCertificationDraft({
      name: certificationItem.name || '',
      issuer: certificationItem.issuer || '',
      issueDate: certificationItem.issueDate || '',
      credentialUrl: certificationItem.credentialUrl || '',
    });
  };

  const handleDeleteCertification = async (certificationId) => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Certification?',
      message: 'Are you sure you want to delete this certification?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    const existingCertifications = Array.isArray(portfolio.certifications) ? portfolio.certifications : [];
    try {
      await onUpdate({ certifications: existingCertifications.filter((item) => item.id !== certificationId) });
      if (editingCertificationId === certificationId) {
        setCertificationDraft({ name: '', issuer: '', issueDate: '', credentialUrl: '' });
        setEditingCertificationId('');
      }
      showSuccess('Certification Deleted', 'Certification removed.');
    } catch {
      showErrorModal('Delete Failed', 'Unable to delete certification right now.');
    }
  };

  const handleSaveContact = async () => {
    try {
      await onUpdate({
        contact: {
          email: contactDraft.email.trim(),
          phone: contactDraft.phone.trim(),
          location: contactDraft.location.trim(),
          website: contactDraft.website.trim(),
        },
      });
      showSuccess('Contact Updated', 'Contact section saved successfully.');
    } catch {
      showErrorModal('Save Failed', 'Unable to save contact right now.');
    }
  };

  const handleDeleteContact = async () => {
    const isConfirmed = await confirm({
      type: 'warning',
      title: 'Delete Contact?',
      message: 'Are you sure you want to delete your contact details?',
      confirmText: 'Yes',
      cancelText: 'No',
    });
    if (!isConfirmed) return;

    try {
      await onUpdate({ contact: { email: '', phone: '', location: '', website: '' } });
      setContactDraft({ email: '', phone: '', location: '', website: '' });
      showSuccess('Contact Deleted', 'Contact section cleared.');
    } catch {
      showErrorModal('Delete Failed', 'Unable to delete contact details right now.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-xl font-semibold text-white">Portfolio Builder</h3>
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
        <button type="submit" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}>
          <Save className="w-4 h-4" />
          Save Profile
        </button>
      </form>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Bio & Experience Level</h4>
        <textarea
          value={bioDraft}
          onChange={(event) => setBioDraft(event.target.value)}
          rows={4}
          placeholder="Write your bio"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
        />
        <div>
          <p className="text-sm text-gray-300 mb-2">Experience level (1-5 stars)</p>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setExperienceLevelDraft(level)}
                className="text-yellow-400"
                aria-label={`Set experience level to ${level}`}
              >
                <Star className={`w-5 h-5 ${level <= experienceLevelDraft ? 'fill-current' : ''}`} />
              </button>
            ))}
            <span className="text-sm text-gray-300 ml-2">{experienceLevelDraft}/5</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveBio}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
          >
            <Save className="w-4 h-4" />
            {portfolio.bio ? 'Update Bio' : 'Create Bio'}
          </button>
          <button
            type="button"
            onClick={handleDeleteBio}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Bio
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Hero Intro</h4>
        <input
          value={heroIntroDraft.title}
          onChange={(event) => setHeroIntroDraft((prev) => ({ ...prev, title: event.target.value }))}
          placeholder="Hero title"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
        />
        <input
          value={heroIntroDraft.subtitle}
          onChange={(event) => setHeroIntroDraft((prev) => ({ ...prev, subtitle: event.target.value }))}
          placeholder="Hero subtitle"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
        />
        <textarea
          value={heroIntroDraft.summary}
          onChange={(event) => setHeroIntroDraft((prev) => ({ ...prev, summary: event.target.value }))}
          rows={3}
          placeholder="Hero summary"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveHeroIntro}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
          >
            <Save className="w-4 h-4" />
            Save Hero Intro
          </button>
          <button
            type="button"
            onClick={handleDeleteHeroIntro}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/10 transition"
          >
            <Trash2 className="w-4 h-4" />
            Delete Hero Intro
          </button>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Skills</h4>
        <div className="flex gap-2">
          <input
            value={portfolioSkillInput}
            onChange={(event) => setPortfolioSkillInput(event.target.value)}
            placeholder="Add skill"
            className="flex-1 px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={handleAddPortfolioSkill}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        {(portfolio.skills || []).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {(portfolio.skills || []).map((skill) => (
              <div key={skill} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white">
                {editingPortfolioSkill === skill ? (
                  <>
                    <input
                      value={editingPortfolioSkillValue}
                      onChange={(event) => setEditingPortfolioSkillValue(event.target.value)}
                      className="w-28 rounded bg-black/20 px-2 py-1 text-xs text-white focus:outline-none"
                    />
                    <button type="button" onClick={handleSaveEditedPortfolioSkill} className="text-[10px]">save</button>
                    <button type="button" onClick={() => { setEditingPortfolioSkill(''); setEditingPortfolioSkillValue(''); }} className="text-[10px] text-red-300">cancel</button>
                  </>
                ) : (
                  <>
                    <span>{skill}</span>
                    <button type="button" onClick={() => startEditPortfolioSkill(skill)} className="text-[10px]">edit</button>
                    <button type="button" onClick={() => handleDeletePortfolioSkill(skill)} className="text-[10px] text-red-300">x</button>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No skills added yet.</p>
        )}
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Projects</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <input
            value={projectDraft.title}
            onChange={(event) => setProjectDraft((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Project title"
            className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white"
          />
          <input
            value={projectDraft.link}
            onChange={(event) => setProjectDraft((prev) => ({ ...prev, link: event.target.value }))}
            placeholder="Project link"
            className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white"
          />
        </div>
        <textarea
          value={projectDraft.description}
          onChange={(event) => setProjectDraft((prev) => ({ ...prev, description: event.target.value }))}
          rows={2}
          placeholder="Project description"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white"
        />
        <input
          value={projectDraft.stackText}
          onChange={(event) => setProjectDraft((prev) => ({ ...prev, stackText: event.target.value }))}
          placeholder="Tech stack (comma separated)"
          className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white"
        />
        <button
          type="button"
          onClick={handleSaveProjectSection}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}
        >
          <Save className="w-4 h-4" />
          {editingProjectId ? 'Update Project' : 'Add Project'}
        </button>
        <div className="space-y-2">
          {(portfolio.projects || []).map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-white text-sm font-medium">{item.title}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => startEditProjectSection(item)} className="text-xs text-gray-300">edit</button>
                  <button type="button" onClick={() => handleDeleteProjectSection(item.id)} className="text-xs text-red-300">delete</button>
                </div>
              </div>
              <p className="text-xs text-gray-300 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Timeline</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={timelineDraft.title} onChange={(event) => setTimelineDraft((prev) => ({ ...prev, title: event.target.value }))} placeholder="Role / Title" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={timelineDraft.organization} onChange={(event) => setTimelineDraft((prev) => ({ ...prev, organization: event.target.value }))} placeholder="Organization" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={timelineDraft.startDate} onChange={(event) => setTimelineDraft((prev) => ({ ...prev, startDate: event.target.value }))} placeholder="Start date" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={timelineDraft.endDate} onChange={(event) => setTimelineDraft((prev) => ({ ...prev, endDate: event.target.value }))} placeholder="End date" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
        </div>
        <textarea value={timelineDraft.description} onChange={(event) => setTimelineDraft((prev) => ({ ...prev, description: event.target.value }))} rows={2} placeholder="Description" className="w-full px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
        <button type="button" onClick={handleSaveTimeline} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}>
          <Save className="w-4 h-4" />
          {editingTimelineId ? 'Update Timeline' : 'Add Timeline'}
        </button>
        <div className="space-y-2">
          {(portfolio.timeline || []).map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm">{item.title} <span className="text-gray-400">({item.organization})</span></p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => startEditTimeline(item)} className="text-xs text-gray-300">edit</button>
                  <button type="button" onClick={() => handleDeleteTimeline(item.id)} className="text-xs text-red-300">delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Certifications</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={certificationDraft.name} onChange={(event) => setCertificationDraft((prev) => ({ ...prev, name: event.target.value }))} placeholder="Certification name" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={certificationDraft.issuer} onChange={(event) => setCertificationDraft((prev) => ({ ...prev, issuer: event.target.value }))} placeholder="Issuer" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={certificationDraft.issueDate} onChange={(event) => setCertificationDraft((prev) => ({ ...prev, issueDate: event.target.value }))} placeholder="Issue date" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={certificationDraft.credentialUrl} onChange={(event) => setCertificationDraft((prev) => ({ ...prev, credentialUrl: event.target.value }))} placeholder="Credential URL" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
        </div>
        <button type="button" onClick={handleSaveCertification} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}>
          <Save className="w-4 h-4" />
          {editingCertificationId ? 'Update Certification' : 'Add Certification'}
        </button>
        <div className="space-y-2">
          {(portfolio.certifications || []).map((item) => (
            <div key={item.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between">
                <p className="text-white text-sm">{item.name} <span className="text-gray-400">({item.issuer})</span></p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => startEditCertification(item)} className="text-xs text-gray-300">edit</button>
                  <button type="button" onClick={() => handleDeleteCertification(item.id)} className="text-xs text-red-300">delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-6 space-y-4">
        <h4 className={`font-semibold ${headingAccentClass}`}>Contact</h4>
        <div className="grid md:grid-cols-2 gap-3">
          <input value={contactDraft.email} onChange={(event) => setContactDraft((prev) => ({ ...prev, email: event.target.value }))} placeholder="Email" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={contactDraft.phone} onChange={(event) => setContactDraft((prev) => ({ ...prev, phone: event.target.value }))} placeholder="Phone" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={contactDraft.location} onChange={(event) => setContactDraft((prev) => ({ ...prev, location: event.target.value }))} placeholder="Location" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
          <input value={contactDraft.website} onChange={(event) => setContactDraft((prev) => ({ ...prev, website: event.target.value }))} placeholder="Website" className="px-3 py-2 rounded-lg border border-white/20 bg-black/20 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={handleSaveContact} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white transition ${activeAccent.primaryButtonClass}`}>
            <Save className="w-4 h-4" />
            Save Contact
          </button>
          <button type="button" onClick={handleDeleteContact} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-400/30 text-red-200 hover:bg-red-500/10 transition">
            <Trash2 className="w-4 h-4" />
            Delete Contact
          </button>
        </div>
      </div>

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
          <div className="flex flex-wrap gap-3">
            {(portfolio.screenshots || []).map((item) => (
              <div key={item.id} className="relative w-32 h-24 border border-white/10 rounded-lg overflow-hidden bg-black/20">
                <img src={item.dataUrl} alt={item.name} className="w-full h-full object-cover" />
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
