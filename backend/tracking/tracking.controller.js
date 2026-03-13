const Portfolio = require('../modules/portfolio');
const QRCode = require('qrcode');

const toCanonicalPublicPath = (portfolio) => `/portfolio/${portfolio.slug || portfolio.username}`;

const resolveFrontendOrigin = (req) => {
  const configured = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL;
  if (configured) return configured.replace(/\/+$/, '');

  const originHeader = req.get('origin');
  if (originHeader) return originHeader.replace(/\/+$/, '');

  return `${req.protocol}://${req.get('host')}`;
};

const generatePortfolioShareAssets = async (req, res) => {
  try {
    const portfolio = await Portfolio.findOne({ ownerId: req.userId }).lean();

    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found. Create your portfolio first.' });
    }

    const sharePath = toCanonicalPublicPath(portfolio);
    const shareUrl = `${resolveFrontendOrigin(req)}${sharePath}`;
    const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
    });

    return res.status(200).json({
      portfolioId: String(portfolio._id),
      sharePath,
      shareUrl,
      qrCodeDataUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to generate portfolio share assets', error: error.message });
  }
};

module.exports = { generatePortfolioShareAssets };
