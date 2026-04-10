const Portfolio = require('../modules/portfolio');
const PortfolioScore = require('../modules/portfolioScore');
const Project = require('../modules/project');
const QuizAttempt = require('../modules/quizAttempt');
const User = require('../modules/userSchema');
const { MentorshipAssignment } = require('../modules/mentorship');

const SCORING_VERSION = 1;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundScore = (value) => Number(clamp(value, 0, 100).toFixed(1));

const buildScoreItem = (key, label, score, max, detail) => ({
  key,
  label,
  score: Number(clamp(score, 0, max).toFixed(1)),
  max,
  detail,
});

const buildCategory = (label, max, items) => ({
  label,
  max,
  items,
  score: Number(items.reduce((sum, item) => sum + Number(item.score || 0), 0).toFixed(1)),
});

const isNonEmptyString = (value) => Boolean(String(value || '').trim());

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const getGrade = (score) => {
  if (score >= 90) return 'Elite';
  if (score >= 75) return 'Strong';
  if (score >= 60) return 'Promising';
  if (score >= 40) return 'Developing';
  return 'Needs Work';
};

const scoreByRatio = (count, target, max) => {
  if (target <= 0) return 0;
  return Math.min(count, target) / target * max;
};

const scoreBoolean = (value, points) => (value ? points : 0);

const getDaysSince = (date) => {
  if (!date) return Infinity;
  const diffMs = Date.now() - new Date(date).getTime();
  return diffMs / (1000 * 60 * 60 * 24);
};

const getBestQuizAttempts = (quizAttempts) => {
  const bestByTrack = new Map();

  for (const attempt of quizAttempts) {
    const track = String(attempt.track || '').trim().toLowerCase();
    if (!track) continue;
    const existing = bestByTrack.get(track);
    if (!existing || Number(attempt.percentage || 0) > Number(existing.percentage || 0)) {
      bestByTrack.set(track, attempt);
    }
  }

  return Array.from(bestByTrack.values());
};

const buildProjectQualityCategory = ({ projects, portfolio }) => {
  const describedProjects = projects.filter((project) => String(project.description || '').trim().length >= 80);
  const deployedProjects = projects.filter((project) => isHttpUrl(project.liveUrl));
  const githubProjects = projects.filter((project) => isHttpUrl(project.githubUrl));
  const screenshotProjects = projects.filter((project) => Array.isArray(project.screenshots) && project.screenshots.length > 0);
  const featuredProjects = projects.filter((project) => project.featured);
  const uniqueTechnologies = new Set(
    projects.flatMap((project) => Array.isArray(project.technologies) ? project.technologies.map((item) => String(item || '').trim()).filter(Boolean) : [])
  );
  const curatedPortfolioProjects = Array.isArray(portfolio?.projects) ? portfolio.projects : [];

  const items = [
    buildScoreItem(
      'project_volume',
      'Project volume',
      scoreByRatio(projects.length, 4, 8),
      8,
      `${projects.length} portfolio project${projects.length === 1 ? '' : 's'} added`
    ),
    buildScoreItem(
      'project_depth',
      'Project depth',
      scoreByRatio(describedProjects.length, Math.max(1, Math.min(projects.length, 3)), 6),
      6,
      `${describedProjects.length} project${describedProjects.length === 1 ? '' : 's'} include strong descriptions`
    ),
    buildScoreItem(
      'live_delivery',
      'Live delivery proof',
      scoreByRatio(deployedProjects.length, 3, 6),
      6,
      `${deployedProjects.length} live demo${deployedProjects.length === 1 ? '' : 's'} linked`
    ),
    buildScoreItem(
      'code_proof',
      'Code proof',
      scoreByRatio(githubProjects.length, 4, 5),
      5,
      `${githubProjects.length} GitHub repo${githubProjects.length === 1 ? '' : 's'} linked`
    ),
    buildScoreItem(
      'presentation_assets',
      'Presentation assets',
      scoreByRatio(screenshotProjects.length + curatedPortfolioProjects.length, 4, 5),
      5,
      `${screenshotProjects.length} screenshot-backed project${screenshotProjects.length === 1 ? '' : 's'} and ${curatedPortfolioProjects.length} curated portfolio project${curatedPortfolioProjects.length === 1 ? '' : 's'}`
    ),
    buildScoreItem(
      'technology_range',
      'Technology range',
      scoreByRatio(uniqueTechnologies.size + featuredProjects.length, 10, 5),
      5,
      `${uniqueTechnologies.size} distinct technolog${uniqueTechnologies.size === 1 ? 'y' : 'ies'} represented`
    ),
  ];

  return {
    category: buildCategory('Project Quality', 30, items),
    signals: {
      projectCount: projects.length,
      deployedProjectCount: deployedProjects.length,
      githubProjectCount: githubProjects.length,
      featuredProjectCount: featuredProjects.length,
      portfolioProjectCount: curatedPortfolioProjects.length,
    },
  };
};

const buildTechnicalEvidenceCategory = ({ user, portfolio, quizAttempts, mentorshipAssignments }) => {
  const bestAttempts = getBestQuizAttempts(quizAttempts);
  const passedAttempts = bestAttempts.filter((attempt) => Boolean(attempt.passed));
  const averageQuizPercentage = bestAttempts.length > 0
    ? bestAttempts.reduce((sum, attempt) => sum + Number(attempt.percentage || 0), 0) / bestAttempts.length
    : 0;
  const codeSnippets = Array.isArray(portfolio?.codeSnippets) ? portfolio.codeSnippets : [];
  const skillCount = Array.isArray(portfolio?.skills) && portfolio.skills.length > 0
    ? portfolio.skills.length
    : Array.isArray(user?.skills) ? user.skills.length : 0;
  const reviewedAssignments = mentorshipAssignments.filter((item) => Number.isFinite(item.score));
  const averageMentorshipScore = reviewedAssignments.length > 0
    ? reviewedAssignments.reduce((sum, item) => sum + Number(item.score || 0), 0) / reviewedAssignments.length
    : null;

  const items = [
    buildScoreItem(
      'github_identity',
      'GitHub identity',
      scoreBoolean(isNonEmptyString(user?.githubUsername), 4),
      4,
      isNonEmptyString(user?.githubUsername) ? 'GitHub username connected' : 'Connect GitHub to improve trust and code proof'
    ),
    buildScoreItem(
      'quiz_performance',
      'Quiz performance',
      (averageQuizPercentage / 100) * 9,
      9,
      `${bestAttempts.length} tracked quiz area${bestAttempts.length === 1 ? '' : 's'} with ${Number(averageQuizPercentage.toFixed(1))}% average`
    ),
    buildScoreItem(
      'quiz_breadth',
      'Quiz breadth',
      scoreByRatio(passedAttempts.length, 4, 4),
      4,
      `${passedAttempts.length} quiz track${passedAttempts.length === 1 ? '' : 's'} passed`
    ),
    buildScoreItem(
      'code_and_skills',
      'Code snippets and skills',
      scoreByRatio(codeSnippets.length, 2, 2) + scoreByRatio(skillCount, 8, 2),
      4,
      `${codeSnippets.length} code snippet${codeSnippets.length === 1 ? '' : 's'} and ${skillCount} listed skill${skillCount === 1 ? '' : 's'}`
    ),
    buildScoreItem(
      'reviewed_work',
      'Reviewed work quality',
      scoreByRatio(reviewedAssignments.length, 3, 2) + ((averageMentorshipScore || 0) / 100) * 2,
      4,
      reviewedAssignments.length > 0
        ? `${reviewedAssignments.length} mentor-reviewed submission${reviewedAssignments.length === 1 ? '' : 's'} averaging ${Number((averageMentorshipScore || 0).toFixed(1))}%`
        : 'No mentor-reviewed submissions yet'
    ),
  ];

  return {
    category: buildCategory('Technical Evidence', 25, items),
    signals: {
      quizTrackCount: bestAttempts.length,
      passedQuizTrackCount: passedAttempts.length,
      averageQuizPercentage: Number(averageQuizPercentage.toFixed(1)),
      mentorshipReviewCount: reviewedAssignments.length,
      averageMentorshipScore: averageMentorshipScore === null ? null : Number(averageMentorshipScore.toFixed(1)),
      portfolioSkillCount: skillCount,
    },
  };
};

const buildProfessionalReadinessCategory = ({ user, portfolio, projects }) => {
  const timeline = Array.isArray(portfolio?.timeline) ? portfolio.timeline : [];
  const certifications = Array.isArray(portfolio?.certifications) ? portfolio.certifications : [];
  const documents = Array.isArray(portfolio?.documents) ? portfolio.documents : [];
  const contact = portfolio?.contact || {};
  const heroIntro = portfolio?.heroIntro || {};
  const featuredProjects = projects.filter((project) => project.featured);

  const items = [
    buildScoreItem(
      'profile_foundation',
      'Profile foundation',
      scoreBoolean(isNonEmptyString(portfolio?.displayName || user?.fullName), 1.5)
        + scoreBoolean(isNonEmptyString(portfolio?.headline), 1.5)
        + scoreBoolean(String(portfolio?.bio || user?.bio || '').trim().length >= 80, 1.5)
        + scoreBoolean(isNonEmptyString(user?.avatar), 1.5),
      6,
      'Display name, headline, bio depth, and avatar all shape first impression'
    ),
    buildScoreItem(
      'contact_readiness',
      'Contact readiness',
      scoreBoolean(isNonEmptyString(contact.email || user?.email), 1.25)
        + scoreBoolean(isHttpUrl(contact.website), 1.25)
        + scoreBoolean(isNonEmptyString(contact.location), 1.25)
        + scoreBoolean(isNonEmptyString(user?.githubUsername), 1.25),
      5,
      'Recruiters should be able to understand who you are and how to reach you quickly'
    ),
    buildScoreItem(
      'career_narrative',
      'Career narrative',
      scoreBoolean(isNonEmptyString(heroIntro.title), 1)
        + scoreBoolean(isNonEmptyString(heroIntro.subtitle), 1)
        + scoreBoolean(String(heroIntro.summary || '').trim().length >= 60, 1)
        + scoreByRatio(timeline.length, 2, 1),
      4,
      `${timeline.length} timeline entr${timeline.length === 1 ? 'y' : 'ies'} helping explain progression`
    ),
    buildScoreItem(
      'credentials',
      'Credentials and documents',
      scoreByRatio(certifications.length, 2, 2) + scoreByRatio(documents.length, 2, 2),
      4,
      `${certifications.length} certification${certifications.length === 1 ? '' : 's'} and ${documents.length} document${documents.length === 1 ? '' : 's'} uploaded`
    ),
    buildScoreItem(
      'portfolio_curation',
      'Portfolio curation',
      scoreByRatio((Array.isArray(portfolio?.projects) ? portfolio.projects.length : 0) + featuredProjects.length, 4, 1),
      1,
      `${featuredProjects.length} featured project${featuredProjects.length === 1 ? '' : 's'} highlighted`
    ),
  ];

  return {
    category: buildCategory('Professional Readiness', 20, items),
  };
};

const buildConsistencyGrowthCategory = ({ user, portfolio, projects, quizAttempts, mentorshipAssignments }) => {
  const activityDates = [
    user?.updatedAt,
    portfolio?.updatedAt,
    ...projects.map((project) => project.updatedAt),
    ...quizAttempts.map((attempt) => attempt.createdAt),
    ...mentorshipAssignments.map((assignment) => assignment.updatedAt),
  ].filter(Boolean);

  const lastActivityAt = activityDates.length > 0
    ? new Date(Math.max(...activityDates.map((value) => new Date(value).getTime())))
    : null;
  const daysSinceLastActivity = getDaysSince(lastActivityAt);
  const recentProjects = projects.filter((project) => getDaysSince(project.updatedAt) <= 90);
  const recentLearningSignals = [
    ...quizAttempts.filter((attempt) => getDaysSince(attempt.createdAt) <= 120),
    ...mentorshipAssignments.filter((assignment) => getDaysSince(assignment.updatedAt) <= 120),
  ];
  const activeSources = [
    getDaysSince(user?.updatedAt) <= 120 ? 'user' : null,
    getDaysSince(portfolio?.updatedAt) <= 120 ? 'portfolio' : null,
    recentProjects.length > 0 ? 'projects' : null,
    quizAttempts.some((attempt) => getDaysSince(attempt.createdAt) <= 120) ? 'quizzes' : null,
    mentorshipAssignments.some((assignment) => getDaysSince(assignment.updatedAt) <= 120) ? 'mentorship' : null,
  ].filter(Boolean);

  const recencyScore = (() => {
    if (daysSinceLastActivity <= 14) return 6;
    if (daysSinceLastActivity <= 30) return 5;
    if (daysSinceLastActivity <= 60) return 3.5;
    if (daysSinceLastActivity <= 90) return 2.5;
    if (daysSinceLastActivity <= 180) return 1;
    return 0;
  })();

  const items = [
    buildScoreItem(
      'recent_activity',
      'Recent activity',
      recencyScore,
      6,
      lastActivityAt ? `Last meaningful update ${Math.floor(daysSinceLastActivity)} day(s) ago` : 'No recent activity recorded yet'
    ),
    buildScoreItem(
      'project_cadence',
      'Project cadence',
      scoreByRatio(recentProjects.length, 3, 4),
      4,
      `${recentProjects.length} project${recentProjects.length === 1 ? '' : 's'} updated in the last 90 days`
    ),
    buildScoreItem(
      'learning_momentum',
      'Learning momentum',
      scoreByRatio(recentLearningSignals.length, 4, 3),
      3,
      `${recentLearningSignals.length} learning or review signal${recentLearningSignals.length === 1 ? '' : 's'} in the last 120 days`
    ),
    buildScoreItem(
      'maintenance_breadth',
      'Maintenance breadth',
      scoreByRatio(activeSources.length, 3, 2),
      2,
      `${activeSources.length} active source${activeSources.length === 1 ? '' : 's'} of portfolio growth`
    ),
  ];

  return {
    category: buildCategory('Consistency & Growth', 15, items),
    signals: {
      lastActivityAt,
    },
  };
};

const buildTrustCompletenessCategory = ({ user, portfolio, projects }) => {
  const certifications = Array.isArray(portfolio?.certifications) ? portfolio.certifications : [];
  const screenshots = Array.isArray(portfolio?.screenshots) ? portfolio.screenshots : [];
  const documents = Array.isArray(portfolio?.documents) ? portfolio.documents : [];
  const portfolioProjects = Array.isArray(portfolio?.projects) ? portfolio.projects : [];
  const allLinks = [
    portfolio?.contact?.website,
    ...projects.flatMap((project) => [project.githubUrl, project.liveUrl]),
    ...portfolioProjects.map((project) => project.link),
    ...certifications.map((item) => item.credentialUrl),
  ].filter((value) => isNonEmptyString(value));
  const validLinkCount = allLinks.filter(isHttpUrl).length;

  const completionSignals = [
    Array.isArray(projects) && projects.length > 0,
    Array.isArray(portfolio?.skills) ? portfolio.skills.length > 0 : Array.isArray(user?.skills) && user.skills.length > 0,
    Array.isArray(portfolio?.timeline) && portfolio.timeline.length > 0,
    isNonEmptyString(portfolio?.headline),
    isNonEmptyString(portfolio?.bio),
    isNonEmptyString(portfolio?.contact?.email || user?.email),
  ].filter(Boolean).length;

  const items = [
    buildScoreItem(
      'identity_confidence',
      'Identity confidence',
      scoreBoolean(isNonEmptyString(user?.avatar), 1) + scoreBoolean(isNonEmptyString(user?.email), 1) + scoreBoolean(isNonEmptyString(user?.githubUsername), 1),
      3,
      'Avatar, email, and GitHub together make the profile feel more credible'
    ),
    buildScoreItem(
      'portfolio_completion',
      'Portfolio completion',
      scoreByRatio(completionSignals, 6, 4),
      4,
      `${completionSignals}/6 core portfolio sections are filled`
    ),
    buildScoreItem(
      'proof_assets',
      'Proof assets',
      scoreByRatio(screenshots.length + documents.length + certifications.length, 4, 2),
      2,
      `${screenshots.length} screenshots, ${documents.length} documents, ${certifications.length} certifications`
    ),
    buildScoreItem(
      'link_quality',
      'Link quality',
      allLinks.length > 0 && validLinkCount === allLinks.length ? 1 : 0,
      1,
      allLinks.length === 0
        ? 'Add a few public links to strengthen trust'
        : `${validLinkCount}/${allLinks.length} public links look valid`
    ),
  ];

  return {
    category: buildCategory('Trust & Completeness', 10, items),
  };
};

const buildInsights = (pillars) => {
  const entries = Object.entries(pillars).map(([key, value]) => ({
    key,
    label: value.label,
    score: Number(value.score || 0),
    max: Number(value.max || 0),
    ratio: value.max > 0 ? Number(value.score || 0) / Number(value.max || 1) : 0,
    weakestItem: [...(value.items || [])].sort((a, b) => a.score - b.score)[0] || null,
  }));

  const strengths = entries
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3)
    .map((entry) => `${entry.label} is a current strength at ${Number((entry.ratio * 100).toFixed(0))}% of its potential.`)
    .filter(Boolean);

  const improvements = entries
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, 3)
    .map((entry) => {
      if (entry.weakestItem) {
        return `Improve ${entry.label.toLowerCase()} by focusing on ${entry.weakestItem.label.toLowerCase()}.`;
      }
      return `Improve ${entry.label.toLowerCase()} with more complete portfolio evidence.`;
    })
    .filter(Boolean);

  return { strengths, improvements };
};

const calculatePortfolioScore = async (ownerId) => {
  const [user, portfolio, projects, quizAttempts, mentorshipAssignments] = await Promise.all([
    User.findById(ownerId).lean(),
    Portfolio.findOne({ ownerId }).lean(),
    Project.find({ ownerId }).lean(),
    QuizAttempt.find({ ownerId }).lean(),
    MentorshipAssignment.find({ studentId: ownerId }).lean(),
  ]);

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (!portfolio) {
    const error = new Error('Portfolio not found');
    error.status = 404;
    throw error;
  }

  const projectQuality = buildProjectQualityCategory({ projects, portfolio });
  const technicalEvidence = buildTechnicalEvidenceCategory({ user, portfolio, quizAttempts, mentorshipAssignments });
  const professionalReadiness = buildProfessionalReadinessCategory({ user, portfolio, projects });
  const consistencyGrowth = buildConsistencyGrowthCategory({ user, portfolio, projects, quizAttempts, mentorshipAssignments });
  const trustCompleteness = buildTrustCompletenessCategory({ user, portfolio, projects });

  const pillars = {
    projectQuality: projectQuality.category,
    technicalEvidence: technicalEvidence.category,
    professionalReadiness: professionalReadiness.category,
    consistencyGrowth: consistencyGrowth.category,
    trustCompleteness: trustCompleteness.category,
  };

  const overallScore = roundScore(
    Object.values(pillars).reduce((sum, pillar) => sum + Number(pillar.score || 0), 0)
  );
  const grade = getGrade(overallScore);
  const insights = buildInsights(pillars);

  return {
    ownerId,
    overallScore,
    grade,
    scoringVersion: SCORING_VERSION,
    pillars,
    strengths: insights.strengths,
    improvements: insights.improvements,
    signals: {
      ...projectQuality.signals,
      ...technicalEvidence.signals,
      ...consistencyGrowth.signals,
    },
    calculatedAt: new Date(),
  };
};

const refreshPortfolioScore = async (ownerId) => {
  const payload = await calculatePortfolioScore(ownerId);
  await PortfolioScore.findOneAndUpdate(
    { ownerId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
  );
  return payload;
};

const getPortfolioScore = async (ownerId, { forceRefresh = true } = {}) => {
  if (forceRefresh) {
    return refreshPortfolioScore(ownerId);
  }

  const existing = await PortfolioScore.findOne({ ownerId }).lean();
  if (existing) {
    return existing;
  }

  return refreshPortfolioScore(ownerId);
};

module.exports = {
  SCORING_VERSION,
  calculatePortfolioScore,
  refreshPortfolioScore,
  getPortfolioScore,
};
