const Portfolio = require('../modules/portfolio');
const User = require('../modules/userSchema');

const ALLOWED_ACCENTS = ['blue', 'emerald', 'rose', 'amber', 'violet'];
const ACCENT_DEBUG = String(process.env.DEBUG_ACCENT || '').trim() === '1';

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const toPortfolioPayload = (doc, fallbackSkills = [], fallbackOwner = {}) => {
  const owner = doc?.ownerId && typeof doc.ownerId === 'object' ? doc.ownerId : null;
  const ownerId = owner?._id || doc.ownerId;
  const ownerSkills = Array.isArray(owner?.skills) ? owner.skills : fallbackSkills;
  const portfolioSkills = Array.isArray(doc.skills) ? doc.skills : [];
  const skills = portfolioSkills.length > 0 ? portfolioSkills : ownerSkills;

  return {
    id: String(doc._id),
    ownerId: String(ownerId),
    ownerAvatar: owner?.avatar || fallbackOwner.avatar || '',
    ownerFullName: owner?.fullName || fallbackOwner.fullName || '',
    username: doc.username,
    slug: doc.slug,
    displayName: doc.displayName,
    headline: doc.headline,
    bio: doc.bio,
    heroIntro: doc.heroIntro || { title: '', subtitle: '', summary: '' },
    projects: doc.projects || [],
    experienceLevel: doc.experienceLevel,
    skills,
    timeline: doc.timeline || [],
    certifications: doc.certifications || [],
    contact: doc.contact || { email: '', phone: '', location: '', website: '' },
    accent: doc.accent,
    screenshots: doc.screenshots || [],
    documents: doc.documents || [],
    codeSnippets: doc.codeSnippets || [],
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

const resolveUniqueSlug = async (base, currentOwnerId = null) => {
  const normalizedBase = normalizeSlug(base) || 'developer';
  let attempt = normalizedBase;
  let counter = 1;

  while (true) {
    const existing = await Portfolio.findOne({ slug: attempt }).lean();
    if (!existing || String(existing.ownerId) === String(currentOwnerId || '')) {
      return attempt;
    }
    counter += 1;
    attempt = `${normalizedBase}-${counter}`;
  }
};

const getMyPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ ownerId: req.userId }).populate('ownerId', 'skills avatar fullName');
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    if (ACCENT_DEBUG) {
      console.log(`[accent][get] owner=${req.userId} accent=${portfolio.accent}`);
    }
    return res.status(200).json({ portfolio: toPortfolioPayload(portfolio) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load portfolio', error: error.message });
  }
};

const createMyPortfolio = async (req, res) => {
  try {
    const existing = await Portfolio.findOne({ ownerId: req.userId }).populate('ownerId', 'skills avatar fullName');
    if (existing) {
      return res.status(200).json({ portfolio: toPortfolioPayload(existing) });
    }

    const user = await User.findById(req.userId).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const usernameBase = user.fullName || user.email.split('@')[0];
    const slug = await resolveUniqueSlug(usernameBase, req.userId);

    const portfolio = await Portfolio.create({
      ownerId: req.userId,
      username: usernameBase,
      slug,
      displayName: user.fullName || usernameBase,
      headline: 'Developer Portfolio',
      bio: 'Building thoughtful software and shipping impactful products.',
      heroIntro: {
        title: user.fullName || usernameBase,
        subtitle: 'Portfolio',
        summary: 'Welcome to my portfolio.',
      },
      projects: [],
      skills: Array.isArray(user.skills) ? user.skills : [],
      timeline: [],
      certifications: [],
      contact: {
        email: user.email || '',
        phone: '',
        location: '',
        website: '',
      },
      experienceLevel: 1,
      accent: 'blue',
      screenshots: [],
      documents: [],
      codeSnippets: [],
    });

    return res.status(201).json({
      portfolio: toPortfolioPayload(
        portfolio,
        user?.skills || [],
        { avatar: user?.avatar || '', fullName: user?.fullName || '' }
      ),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create portfolio', error: error.message });
  }
};

const updateMyPortfolio = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ ownerId: req.userId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const updates = { ...req.body };

    if (updates.username !== undefined) {
      const username = String(updates.username || '').trim();
      if (username) {
        updates.username = username;
        updates.slug = await resolveUniqueSlug(username, req.userId);
      } else {
        delete updates.username;
      }
    }

    if (updates.displayName !== undefined) updates.displayName = String(updates.displayName || '').trim();
    if (updates.headline !== undefined) updates.headline = String(updates.headline || '').trim();
    if (updates.bio !== undefined) updates.bio = String(updates.bio || '').trim();
    if (updates.heroIntro !== undefined) {
      const heroIntro = updates.heroIntro && typeof updates.heroIntro === 'object' ? updates.heroIntro : {};
      updates.heroIntro = {
        title: String(heroIntro.title || '').trim(),
        subtitle: String(heroIntro.subtitle || '').trim(),
        summary: String(heroIntro.summary || '').trim(),
      };
    }
    if (updates.projects !== undefined && !Array.isArray(updates.projects)) updates.projects = [];
    if (Array.isArray(updates.projects)) {
      updates.projects = updates.projects.map((item) => ({
        id: String(item?.id || ''),
        title: String(item?.title || '').trim(),
        description: String(item?.description || '').trim(),
        link: String(item?.link || '').trim(),
        stack: Array.isArray(item?.stack) ? item.stack.map((tech) => String(tech || '').trim()).filter(Boolean) : [],
      })).filter((item) => item.id);
    }
    if (updates.skills !== undefined) {
      updates.skills = Array.isArray(updates.skills)
        ? [...new Set(updates.skills.map((skill) => String(skill || '').trim()).filter(Boolean))]
        : [];
    }
    if (updates.timeline !== undefined && !Array.isArray(updates.timeline)) updates.timeline = [];
    if (Array.isArray(updates.timeline)) {
      updates.timeline = updates.timeline.map((item) => ({
        id: String(item?.id || ''),
        title: String(item?.title || '').trim(),
        organization: String(item?.organization || '').trim(),
        startDate: String(item?.startDate || '').trim(),
        endDate: String(item?.endDate || '').trim(),
        description: String(item?.description || '').trim(),
      })).filter((item) => item.id);
    }
    if (updates.certifications !== undefined && !Array.isArray(updates.certifications)) updates.certifications = [];
    if (Array.isArray(updates.certifications)) {
      updates.certifications = updates.certifications.map((item) => ({
        id: String(item?.id || ''),
        name: String(item?.name || '').trim(),
        issuer: String(item?.issuer || '').trim(),
        issueDate: String(item?.issueDate || '').trim(),
        credentialUrl: String(item?.credentialUrl || '').trim(),
      })).filter((item) => item.id);
    }
    if (updates.contact !== undefined) {
      const contact = updates.contact && typeof updates.contact === 'object' ? updates.contact : {};
      updates.contact = {
        email: String(contact.email || '').trim(),
        phone: String(contact.phone || '').trim(),
        location: String(contact.location || '').trim(),
        website: String(contact.website || '').trim(),
      };
    }
    if (updates.experienceLevel !== undefined) {
      const numericLevel = Number(updates.experienceLevel);
      updates.experienceLevel = Number.isFinite(numericLevel)
        ? Math.min(5, Math.max(1, Math.round(numericLevel)))
        : 1;
    }
    if (updates.accent !== undefined) {
      const requestedAccent = String(updates.accent || '').trim().toLowerCase();
      updates.accent = ALLOWED_ACCENTS.includes(requestedAccent)
        ? requestedAccent
        : String(portfolio.accent || 'blue').trim().toLowerCase();
      if (ACCENT_DEBUG) {
        console.log(`[accent][patch:request] owner=${req.userId} requested=${requestedAccent} normalized=${updates.accent}`);
      }
    }
    if (updates.screenshots !== undefined && !Array.isArray(updates.screenshots)) updates.screenshots = [];
    if (updates.documents !== undefined && !Array.isArray(updates.documents)) updates.documents = [];
    if (updates.codeSnippets !== undefined && !Array.isArray(updates.codeSnippets)) updates.codeSnippets = [];

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { ownerId: req.userId },
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('ownerId', 'skills avatar fullName');

    if (ACCENT_DEBUG && updates.accent !== undefined) {
      console.log(`[accent][patch:result] owner=${req.userId} persisted=${updatedPortfolio?.accent}`);
    }

    return res.status(200).json({ portfolio: toPortfolioPayload(updatedPortfolio) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update portfolio', error: error.message });
  }
};

const getPublicPortfolio = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    const portfolio = await Portfolio.findOne({
      $or: [{ slug }, { username: req.params.slug }],
    }).populate('ownerId', 'skills avatar fullName');

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    return res.status(200).json({ portfolio: toPortfolioPayload(portfolio) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load public portfolio', error: error.message });
  }
};

const deleteMyPortfolio = async (req, res) => {
  try {
    const deleted = await Portfolio.findOneAndDelete({ ownerId: req.userId });
    if (!deleted) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    return res.status(200).json({ message: 'Portfolio deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete portfolio', error: error.message });
  }
};

module.exports = {
  getMyPortfolio,
  createMyPortfolio,
  updateMyPortfolio,
  deleteMyPortfolio,
  getPublicPortfolio,
};
