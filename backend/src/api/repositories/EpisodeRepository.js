const { Episode, Series } = require('../../models');
const { Op } = require('sequelize');

class EpisodeRepository {
  async findById(id) {
    return Episode.findByPk(id, {
      include: [{ model: Series, as: 'series', attributes: ['id', 'title', 'slug', 'thumbnail_url'] }],
    });
  }

  async findBySeriesId(seriesId) {
    return Episode.findAll({
      where: { series_id: seriesId },
      order: [['season_number', 'ASC'], ['episode_number', 'ASC']],
    });
  }

  async findBySeriesAndEpisode(seriesId, episodeId) {
    return Episode.findOne({ where: { id: episodeId, series_id: seriesId } });
  }

  async create(data) {
    return Episode.create(data);
  }

  async updateById(id, data) {
    const [affected] = await Episode.update(data, { where: { id } });
    return affected;
  }

  async deleteById(id) {
    return Episode.destroy({ where: { id } });
  }

  async episodeExists(seriesId, seasonNumber, episodeNumber, excludeId = null) {
    const where = { series_id: seriesId, season_number: seasonNumber, episode_number: episodeNumber };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const count = await Episode.count({ where });
    return count > 0;
  }
}

module.exports = new EpisodeRepository();
