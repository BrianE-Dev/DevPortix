const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');
const PortfolioSettings = require('../modules/portfolioSettings');
const Portfolio = require('../modules/portfolio');
const PortfolioScore = require('../modules/portfolioScore');
const Project = require('../modules/project');
const { MentorshipLink, MentorshipAssignment } = require('../modules/mentorship');
const { CommunityPost, CommunityComment, CommunityPostLike } = require('../modules/community');
const CommunityMessage = require('../modules/communityMessage');
const FriendRequest = require('../modules/friendRequest');
const { refreshPortfolioScore } = require('../services/portfolioScoring');

const BASIC_ROLES = new Set(['student', 'instructor', 'organization', 'professional']);
const ALL_ROLES = new Set(['student', 'instructor', 'organization', 'professional', 'super_admin']);

const toPublicUser = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  githubUsername: userDoc.githubUsername,
  avatar: userDoc.avatar,
  bio: userDoc.bio || '',
  subscription: userDoc.subscription,
  skills: Array.isArray(userDoc.skills) ? userDoc.skills : [],
  dashboardMenu: userDoc.dashboardMenu || {},
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

const me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load profile', error: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    console.log('[updateProfile] incoming body:', req.body);
    const requester = await User.findById(req.userId).select('role subscription');
    if (!requester) {
      return res.status(404).json({ message: 'User not found' });
    }

    const requesterRole = String(requester.role || '').trim().toLowerCase();
    const allowedFields = ['fullName', 'githubUsername', 'avatar', 'bio', 'role', 'skills', 'dashboardMenu'];
    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
    );

    if (updates.role !== undefined) {
      const requestedRole = String(updates.role || '').trim().toLowerCase();
      const roleSet = requesterRole === 'super_admin' ? ALL_ROLES : BASIC_ROLES;
      if (!roleSet.has(requestedRole)) {
        return res.status(403).json({ message: 'You are not allowed to assign this role' });
      }
      updates.role = requestedRole;
    }

    if (updates.skills !== undefined) {
      if (!Array.isArray(updates.skills)) {
        return res.status(400).json({ message: 'Skills must be an array' });
      }

      const normalizedSkills = [...new Set(
        updates.skills
          .map((skill) => String(skill || '').trim())
          .filter(Boolean)
          .slice(0, 50)
      )];

      updates.skills = normalizedSkills;
      console.log('[updateProfile] normalized skills:', normalizedSkills);
    }

    if (updates.dashboardMenu !== undefined) {
      const nextMenu = updates.dashboardMenu;
      if (!nextMenu || typeof nextMenu !== 'object' || Array.isArray(nextMenu)) {
        return res.status(400).json({ message: 'Dashboard menu must be an object' });
      }

      const allowedMenuKeys = ['student', 'organization', 'professional', 'instructor'];
      const normalizedMenu = {};
      for (const key of allowedMenuKeys) {
        if (nextMenu[key] !== undefined) {
          normalizedMenu[key] = String(nextMenu[key] || '').trim().slice(0, 80);
        }
      }
      updates.dashboardMenu = normalizedMenu;
      console.log('[updateProfile] normalized dashboardMenu:', normalizedMenu);
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      returnDocument: 'after',
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (updates.subscription) {
      await Subscription.findOneAndUpdate(
        { ownerId: req.userId },
        { $set: { plan: updates.subscription } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
    }

    console.log('[updateProfile] saved user snapshot:', {
      id: String(user._id),
      skills: user.skills,
      dashboardMenu: user.dashboardMenu,
      updatedAt: user.updatedAt,
    });

    try {
      const hasPortfolio = await Portfolio.exists({ ownerId: req.userId });
      if (hasPortfolio) {
        await refreshPortfolioScore(req.userId);
      }
    } catch (scoreError) {
      console.error('[updateProfile] portfolio score refresh failed:', scoreError.message);
    }

    return res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('[updateProfile] error:', error);
    return res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('_id');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await Promise.all([
      Subscription.deleteOne({ ownerId: userId }),
      PortfolioSettings.deleteOne({ ownerId: userId }),
      Portfolio.deleteOne({ ownerId: userId }),
      PortfolioScore.deleteOne({ ownerId: userId }),
      Project.deleteMany({ ownerId: userId }),
      MentorshipLink.deleteMany({
        $or: [{ instructorId: userId }, { studentId: userId }],
      }),
      MentorshipAssignment.deleteMany({
        $or: [{ instructorId: userId }, { studentId: userId }],
      }),
      CommunityPost.deleteMany({ ownerId: userId }),
      CommunityComment.deleteMany({ ownerId: userId }),
      CommunityPostLike.deleteMany({ ownerId: userId }),
      CommunityMessage.deleteMany({ ownerId: userId }),
      FriendRequest.deleteMany({
        $or: [{ requesterId: userId }, { recipientId: userId }],
      }),
      User.deleteOne({ _id: userId }),
    ]);

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete account', error: error.message });
  }
};

module.exports = {
  me,
  updateProfile,
  deleteAccount,
};
