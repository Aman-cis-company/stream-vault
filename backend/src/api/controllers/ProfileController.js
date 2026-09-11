const bcrypt = require('bcryptjs');
const { UserProfile, WatchHistory, UserInteraction } = require('../../models');
const { ensureDefaultProfile } = require('../helpers/profileHelper');

class ProfileController {
  /**
   * Get all sub-profiles for authenticated user
   */
  async getProfiles(req, res) {
    try {
      const profiles = await ensureDefaultProfile(req.user);
      return res.json({
        success: true,
        data: { profiles },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch profiles',
        error: err.message,
      });
    }
  }

  /**
   * Create a new sub-profile
   */
  async createProfile(req, res) {
    try {
      const { name, avatar, profile_type, is_kids, max_rating, pin } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Profile name is required' });
      }

      // Check max profiles limit (max 5 profiles per account)
      const count = await UserProfile.count({ where: { user_id: req.user.id } });
      if (count >= 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum limit of 5 sub-profiles reached for this account',
        });
      }

      const type = profile_type || (is_kids ? 'kids' : 'adult');
      const kidsFlag = is_kids !== undefined ? Boolean(is_kids) : type === 'kids';

      // Auto default max_rating based on profile type if not explicitly set
      let rating = max_rating;
      if (!rating) {
        if (type === 'kids') rating = 'PG';
        else if (type === 'teen') rating = 'PG-13';
        else rating = '21+';
      }

      let pinHash = null;
      if (pin && String(pin).trim()) {
        pinHash = await bcrypt.hash(String(pin).trim(), 10);
      }

      const newProfile = await UserProfile.create({
        user_id: req.user.id,
        name: name.trim(),
        avatar: avatar || (kidsFlag ? 'avatar_kids_1' : 'avatar_1'),
        profile_type: type,
        is_kids: kidsFlag,
        max_rating: rating,
        pin_hash: pinHash,
        is_default: false,
      });

      const profileData = newProfile.toJSON();
      delete profileData.pin_hash;

      return res.status(201).json({
        success: true,
        message: 'Sub-profile created successfully',
        data: { profile: profileData },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create profile',
        error: err.message,
      });
    }
  }

  /**
   * Get profile by ID
   */
  async getProfileById(req, res) {
    try {
      const { id } = req.params;
      const profile = await UserProfile.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      return res.json({ success: true, data: { profile } });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
    }
  }

  /**
   * Update a sub-profile
   */
  async updateProfile(req, res) {
    try {
      const { id } = req.params;
      const { name, avatar, profile_type, is_kids, max_rating, pin, remove_pin } = req.body;

      const profile = await UserProfile.scope('withPin').findOne({
        where: { id, user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      if (name && name.trim()) profile.name = name.trim();
      if (avatar) profile.avatar = avatar;

      if (profile_type) profile.profile_type = profile_type;
      if (is_kids !== undefined) profile.is_kids = Boolean(is_kids);
      if (max_rating) profile.max_rating = max_rating;

      if (remove_pin) {
        profile.pin_hash = null;
      } else if (pin && String(pin).trim()) {
        profile.pin_hash = await bcrypt.hash(String(pin).trim(), 10);
      }

      await profile.save();

      const profileData = profile.toJSON();
      delete profileData.pin_hash;

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { profile: profileData },
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
  }

  /**
   * Delete sub-profile
   */
  async deleteProfile(req, res) {
    try {
      const { id } = req.params;

      const profile = await UserProfile.findOne({
        where: { id, user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      if (profile.is_default) {
        return res.status(400).json({
          success: false,
          message: 'The default main profile cannot be deleted',
        });
      }

      const totalCount = await UserProfile.count({ where: { user_id: req.user.id } });
      if (totalCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'You must keep at least one profile under your account',
        });
      }

      await profile.destroy();

      return res.json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to delete profile', error: err.message });
    }
  }

  /**
   * Verify PIN for a profile
   */
  async verifyPin(req, res) {
    try {
      const { id } = req.params;
      const { pin } = req.body;

      if (!pin) {
        return res.status(400).json({ success: false, message: 'PIN is required' });
      }

      const profile = await UserProfile.scope('withPin').findOne({
        where: { id, user_id: req.user.id },
      });

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
      }

      if (!profile.pin_hash) {
        return res.json({ success: true, verified: true, message: 'No PIN set for this profile' });
      }

      const match = await bcrypt.compare(String(pin).trim(), profile.pin_hash);
      if (!match) {
        return res.status(401).json({ success: false, verified: false, message: 'Incorrect PIN' });
      }

      return res.json({ success: true, verified: true, message: 'PIN verified successfully' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to verify PIN', error: err.message });
    }
  }
}

module.exports = new ProfileController();
