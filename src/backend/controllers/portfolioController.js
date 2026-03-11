const Portfolio = require('../modules/portfolio');
const User = require('../modules/userSchema');

const normalizeSlug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const toPortfolioPayload = (doc) => ({
  id: String(doc._id),
  ownerId: String(doc.ownerId),
  username: doc.username,
  slug: doc.slug,
  displayName: doc.displayName,
  headline: doc.headline,
  bio: doc.bio,
  accent: doc.accent,
  screenshots: doc.screenshots || [],
  documents: doc.documents || [],
  codeSnippets: doc.codeSnippets || [],
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

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
    const portfolio = await Portfolio.findOne({ ownerId: req.userId });
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }
    return res.status(200).json({ portfolio: toPortfolioPayload(portfolio) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load portfolio', error: error.message });
  }
};

const createMyPortfolio = async (req, res) => {
  try {
    const existing = await Portfolio.findOne({ ownerId: req.userId });
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
      accent: 'blue',
      screenshots: [],
      documents: [],
      codeSnippets: [],
    });

    return res.status(201).json({ portfolio: toPortfolioPayload(portfolio) });
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
    if (updates.accent !== undefined) updates.accent = String(updates.accent || 'blue').trim();
    if (updates.screenshots !== undefined && !Array.isArray(updates.screenshots)) updates.screenshots = [];
    if (updates.documents !== undefined && !Array.isArray(updates.documents)) updates.documents = [];
    if (updates.codeSnippets !== undefined && !Array.isArray(updates.codeSnippets)) updates.codeSnippets = [];

    Object.assign(portfolio, updates);
    await portfolio.save();

    return res.status(200).json({ portfolio: toPortfolioPayload(portfolio) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update portfolio', error: error.message });
  }
};

const getPublicPortfolio = async (req, res) => {
  try {
    const slug = normalizeSlug(req.params.slug);
    const portfolio = await Portfolio.findOne({
      $or: [{ slug }, { username: req.params.slug }],
    });

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    return res.status(200).json({ portfolio: toPortfolioPayload(portfolio) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load public portfolio', error: error.message });
  }
};

module.exports = {
  getMyPortfolio,
  createMyPortfolio,
  updateMyPortfolio,
  getPublicPortfolio,
};
