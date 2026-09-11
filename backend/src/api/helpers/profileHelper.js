const { UserProfile, WatchHistory, UserInteraction } = require('../../models');

/**
 * Ensures user has at least one sub-profile (default Adult profile).
 * Automatically links existing orphan watch history & interactions to the default profile.
 * Returns profiles with `has_pin` boolean attribute set.
 */
async function ensureDefaultProfile(user) {
  if (!user || !user.id) return null;

  let profiles = await UserProfile.scope('withPin').findAll({
    where: { user_id: user.id },
    order: [['is_default', 'DESC'], ['id', 'ASC']],
  });

  if (profiles.length === 0) {
    const displayName = (user.first_name || user.username || user.name || 'Main Profile').trim();
    const defaultProfile = await UserProfile.create({
      user_id: user.id,
      name: displayName || 'Main Profile',
      avatar: 'avatar_1',
      profile_type: 'adult',
      is_kids: false,
      max_rating: '21+',
      is_default: true,
    });

    // Retroactively associate existing watch history without profile_id to this default profile
    await WatchHistory.update(
      { profile_id: defaultProfile.id },
      { where: { user_id: user.id, profile_id: null } }
    ).catch(() => {});

    await UserInteraction.update(
      { profile_id: defaultProfile.id },
      { where: { user_id: user.id, profile_id: null } }
    ).catch(() => {});

    profiles = [defaultProfile];
  }

  return profiles.map((p) => {
    const json = p.toJSON();
    json.has_pin = Boolean(json.pin_hash);
    delete json.pin_hash;
    return json;
  });
}

/**
 * Helper to get active profile ID from request header `x-profile-id` or body/query.
 * Falls back to the default profile ID if omitted or invalid.
 */
async function getActiveProfile(req) {
  if (!req.user || !req.user.id) return null;

  const profiles = await ensureDefaultProfile(req.user);
  if (!profiles || profiles.length === 0) return null;

  const headerProfileId = req.headers['x-profile-id'] || req.headers['x-profile-id'] || req.query?.profile_id || req.body?.profile_id;
  if (headerProfileId) {
    const profileIdNum = parseInt(headerProfileId, 10);
    const matched = profiles.find((p) => p.id === profileIdNum);
    if (matched) return matched;
  }

  // Fallback to default or first profile
  const defaultProf = profiles.find((p) => p.is_default) || profiles[0];
  return defaultProf;
}

/**
 * Get effective parental & age controls combining User's ParentalControl settings and active Profile's age restrictions.
 */
async function getEffectiveParentalControls(req) {
  if (!req || !req.user) return null;

  const { ParentalControl } = require('../../models');
  const userControls = await ParentalControl.findOne({ where: { user_id: req.user.id } });
  const activeProfile = await getActiveProfile(req);

  const effective = {
    hide_restricted_content: userControls?.hide_restricted_content || false,
    max_rating: userControls?.max_rating || '21+',
    is_kids: false,
  };

  if (activeProfile) {
    if (activeProfile.is_kids || activeProfile.profile_type === 'kids') {
      effective.hide_restricted_content = true;
      effective.is_kids = true;
      effective.max_rating = activeProfile.max_rating && activeProfile.max_rating !== '21+' ? activeProfile.max_rating : 'PG';
    } else if (activeProfile.profile_type === 'teen') {
      if (!effective.max_rating || effective.max_rating === '21+' || effective.max_rating === '18+') {
        effective.max_rating = activeProfile.max_rating && activeProfile.max_rating !== '21+' ? activeProfile.max_rating : 'PG-13';
      }
    } else if (activeProfile.max_rating && activeProfile.max_rating !== '21+') {
      effective.max_rating = activeProfile.max_rating;
    }
  }

  return effective;
}

/**
 * Rating hierarchy order helper for content restriction logic
 */
const RATING_ORDER = ['G', 'PG', 'PG-13', '16+', '18+', '21+'];

function isRatingAllowed(contentRating, maxRating) {
  if (!maxRating || maxRating === '21+') return true;
  if (!contentRating) return true;

  const contentIdx = RATING_ORDER.indexOf(contentRating.toUpperCase());
  const maxIdx = RATING_ORDER.indexOf(maxRating.toUpperCase());

  if (contentIdx === -1 || maxIdx === -1) return true;
  return contentIdx <= maxIdx;
}

module.exports = {
  ensureDefaultProfile,
  getActiveProfile,
  getEffectiveParentalControls,
  isRatingAllowed,
  RATING_ORDER,
};
