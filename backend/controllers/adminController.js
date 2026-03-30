const User = require('../modules/userSchema');
const Subscription = require('../modules/subscription');

const ALLOWED_ROLES = new Set(['student', 'instructor', 'organization', 'professional', 'super_admin']);

const toAdminUserPayload = (userDoc) => ({
  id: String(userDoc._id),
  fullName: userDoc.fullName,
  email: userDoc.email,
  role: userDoc.role,
  subscription: userDoc.subscription,
  githubUsername: userDoc.githubUsername,
  createdAt: userDoc.createdAt,
  updatedAt: userDoc.updatedAt,
});

const listUsers = async (_req, res) => {
  try {
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select('fullName email role subscription githubUsername createdAt updatedAt');

    return res.status(200).json({
      users: users.map(toAdminUserPayload),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load users', error: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const userId = String(req.params.id || '').trim();
    const nextRole = String(req.body?.role || '')
      .trim()
      .toLowerCase();

    if (!ALLOWED_ROLES.has(nextRole)) {
      return res.status(400).json({ message: 'Invalid role value' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    targetUser.role = nextRole;
    await targetUser.save();

    await Subscription.findOneAndUpdate(
      { ownerId: targetUser._id },
      { $set: { plan: targetUser.subscription } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      message: 'User role updated',
      user: toAdminUserPayload(targetUser),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update user role', error: error.message });
  }
};

module.exports = {
  listUsers,
  updateUserRole,
};
