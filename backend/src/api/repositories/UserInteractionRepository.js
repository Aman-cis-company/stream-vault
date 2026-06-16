const { UserInteraction, Movie, Series } = require('../../models');
const { Op } = require('sequelize');

class UserInteractionRepository {
  async findOrCreate(userId, contentType, contentId) {
    const [record] = await UserInteraction.findOrCreate({
      where: { user_id: userId, content_type: contentType, content_id: contentId },
      defaults: { is_liked: false, in_list: false },
    });
    return record;
  }

  async findOne(userId, contentType, contentId) {
    return UserInteraction.findOne({
      where: { user_id: userId, content_type: contentType, content_id: contentId },
    });
  }

  async upsertToggleLike(userId, contentType, contentId) {
    const record = await this.findOrCreate(userId, contentType, contentId);
    record.is_liked = !record.is_liked;
    await record.save();
    return record;
  }

  async upsertToggleList(userId, contentType, contentId) {
    const record = await this.findOrCreate(userId, contentType, contentId);
    record.in_list = !record.in_list;
    await record.save();
    return record;
  }

  async getList(userId) {
    const rows = await UserInteraction.findAll({
      where: { user_id: userId, in_list: true },
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

    const { ParentalControl } = require('../../models');
    const { filterContentByParentalControls } = require('../../helpers/parentalFilter');
    const controls = await ParentalControl.findOne({ where: { user_id: userId } });

    const filteredMovies = filterContentByParentalControls(movies, controls);
    const filteredSeriesList = filterContentByParentalControls(seriesList, controls);

    const movieMap = Object.fromEntries(filteredMovies.map((m) => [m.id, m]));
    const seriesMap = Object.fromEntries(filteredSeriesList.map((s) => [s.id, s]));

    return rows.map((r) => {
      const detail = r.content_type === 'movie' ? movieMap[r.content_id] : seriesMap[r.content_id];
      return { interaction: r, detail: detail ?? null };
    }).filter((x) => x.detail !== null);
  }

  async getLiked(userId) {
    const rows = await UserInteraction.findAll({
      where: { user_id: userId, is_liked: true },
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

    const { ParentalControl } = require('../../models');
    const { filterContentByParentalControls } = require('../../helpers/parentalFilter');
    const controls = await ParentalControl.findOne({ where: { user_id: userId } });

    const filteredMovies = filterContentByParentalControls(movies, controls);
    const filteredSeriesList = filterContentByParentalControls(seriesList, controls);

    const movieMap = Object.fromEntries(filteredMovies.map((m) => [m.id, m]));
    const seriesMap = Object.fromEntries(filteredSeriesList.map((s) => [s.id, s]));

    return rows.map((r) => {
      const detail = r.content_type === 'movie' ? movieMap[r.content_id] : seriesMap[r.content_id];
      return { interaction: r, detail: detail ?? null };
    }).filter((x) => x.detail !== null);
  }
}

module.exports = new UserInteractionRepository();
