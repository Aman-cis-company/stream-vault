const { WatchHistory } = require('../../models');

class WatchProgressRepository {
  async upsertEpisodeProgress(userId, episodeId, watchTime, completionPct) {
    const [record, created] = await WatchHistory.findOrCreate({
      where: { user_id: userId, episode_id: episodeId },
      defaults: {
        movie_id: null,
        watch_time: watchTime,
        completion_percentage: completionPct,
        last_watched_at: new Date(),
      },
    });

    if (!created) {
      await record.update({
        watch_time: watchTime,
        completion_percentage: completionPct,
        last_watched_at: new Date(),
      });
    }

    return record;
  }

  async getEpisodeProgress(userId, episodeId) {
    return WatchHistory.findOne({
      where: { user_id: userId, episode_id: episodeId },
    });
  }
}

module.exports = new WatchProgressRepository();
