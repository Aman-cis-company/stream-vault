const { UserInteraction, Movie, Series } = require('../../models');
const { Op } = require('sequelize');

class UserInteractionRepository {
  async findOrCreate(userId, contentType, contentId, profileId = null) {
    const whereCondition = { user_id: userId, content_type: contentType, content_id: contentId };
    if (profileId) whereCondition.profile_id = profileId;

    const [record] = await UserInteraction.findOrCreate({
      where: whereCondition,
      defaults: { user_id: userId, profile_id: profileId, content_type: contentType, content_id: contentId, is_liked: false, in_list: false },
    });
    return record;
  }

  async findOne(userId, contentType, contentId, profileId = null) {
    const whereCondition = { user_id: userId, content_type: contentType, content_id: contentId };
    if (profileId) whereCondition.profile_id = profileId;
    return UserInteraction.findOne({ where: whereCondition });
  }

  async upsertToggleLike(userId, contentType, contentId, profileId = null) {
    const record = await this.findOrCreate(userId, contentType, contentId, profileId);
    record.is_liked = !record.is_liked;
    if (profileId) record.profile_id = profileId;
    await record.save();
    return record;
  }

  async upsertToggleList(userId, contentType, contentId, profileId = null) {
    const record = await this.findOrCreate(userId, contentType, contentId, profileId);
    record.in_list = !record.in_list;
    if (profileId) record.profile_id = profileId;
    await record.save();
    return record;
  }

  async getList(userId, profileId = null) {
    const whereCondition = { user_id: userId, in_list: true };
    if (profileId) whereCondition.profile_id = profileId;

    const rows = await UserInteraction.findAll({
      where: whereCondition,
      order: [['updated_at', 'DESC']],
    });

    const movieIds = rows.filter((r) => r.content_type === 'movie').map((r) => r.content_id);
    const seriesIds = rows.filter((r) => r.content_type === 'series').map((r) => r.content_id);

    const [movies, seriesList] = await Promise.all([
      movieIds.length
        ? Movie.findAll({ where: { id: { [Op.in]: movieIds } }, attributes: ['id', 'title', 'thumbnail_url', 'duration', 'release_date', 'status', 'is_age_restricted', 'content_rating'] })
        : [],
      seriesIds.length
        ? Series.findAll({ where: { id: { [Op.in]: seriesIds } }, attributes: ['id', 'title', 'thumbnail_url', 'release_date', 'status', 'is_age_restricted', 'content_rating'] })
        : [],
    ]);

    const { ParentalControl, UserProfile } = require('../../models');
    const { filterContentByParentalControls } = require('../../helpers/parentalFilter');
    const controls = await ParentalControl.findOne({ where: { user_id: userId } });
    const effectiveControls = {
      hide_restricted_content: controls?.hide_restricted_content || false,
      max_rating: controls?.max_rating || '21+',
    };
    if (profileId) {
      const prof = await UserProfile.findByPk(profileId);
      if (prof) {
        if (prof.is_kids || prof.profile_type === 'kids') {
          effectiveControls.hide_restricted_content = true;
          effectiveControls.max_rating = prof.max_rating && prof.max_rating !== '21+' ? prof.max_rating : 'PG';
        } else if (prof.max_rating && prof.max_rating !== '21+') {
          effectiveControls.max_rating = prof.max_rating;
        }
      }
    }

    const filteredMovies = filterContentByParentalControls(movies, effectiveControls);
    const filteredSeriesList = filterContentByParentalControls(seriesList, effectiveControls);

    const movieMap = Object.fromEntries(filteredMovies.map((m) => [m.id, m]));
    const seriesMap = Object.fromEntries(filteredSeriesList.map((s) => [s.id, s]));

    return rows.map((r) => {
      const detail = r.content_type === 'movie' ? movieMap[r.content_id] : seriesMap[r.content_id];
      return { interaction: r, detail: detail ?? null };
    }).filter((x) => x.detail !== null);
  }

  async getLiked(userId, profileId = null) {
    const whereCondition = { user_id: userId, is_liked: true };
    if (profileId) whereCondition.profile_id = profileId;

    const rows = await UserInteraction.findAll({
      where: whereCondition,
      order: [['updated_at', 'DESC']],
    });

    const movieIds = rows.filter((r) => r.content_type === 'movie').map((r) => r.content_id);
    const seriesIds = rows.filter((r) => r.content_type === 'series').map((r) => r.content_id);

    const [movies, seriesList] = await Promise.all([
      movieIds.length
        ? Movie.findAll({ where: { id: { [Op.in]: movieIds } }, attributes: ['id', 'title', 'thumbnail_url', 'duration', 'release_date', 'status', 'is_age_restricted', 'content_rating'] })
        : [],
      seriesIds.length
        ? Series.findAll({ where: { id: { [Op.in]: seriesIds } }, attributes: ['id', 'title', 'thumbnail_url', 'release_date', 'status', 'is_age_restricted', 'content_rating'] })
        : [],
    ]);

    const { ParentalControl, UserProfile } = require('../../models');
    const { filterContentByParentalControls } = require('../../helpers/parentalFilter');
    const controls = await ParentalControl.findOne({ where: { user_id: userId } });
    const effectiveControls = {
      hide_restricted_content: controls?.hide_restricted_content || false,
      max_rating: controls?.max_rating || '21+',
    };
    if (profileId) {
      const prof = await UserProfile.findByPk(profileId);
      if (prof) {
        if (prof.is_kids || prof.profile_type === 'kids') {
          effectiveControls.hide_restricted_content = true;
          effectiveControls.max_rating = prof.max_rating && prof.max_rating !== '21+' ? prof.max_rating : 'PG';
        } else if (prof.max_rating && prof.max_rating !== '21+') {
          effectiveControls.max_rating = prof.max_rating;
        }
      }
    }

    const filteredMovies = filterContentByParentalControls(movies, effectiveControls);
    const filteredSeriesList = filterContentByParentalControls(seriesList, effectiveControls);

    const movieMap = Object.fromEntries(filteredMovies.map((m) => [m.id, m]));
    const seriesMap = Object.fromEntries(filteredSeriesList.map((s) => [s.id, s]));

    return rows.map((r) => {
      const detail = r.content_type === 'movie' ? movieMap[r.content_id] : seriesMap[r.content_id];
      return { interaction: r, detail: detail ?? null };
    }).filter((x) => x.detail !== null);
  }
}

module.exports = new UserInteractionRepository();
