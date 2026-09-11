const { WatchHistory } = require('../../models');

class WatchProgressRepository {
  async upsertEpisodeProgress(userId, episodeId, watchTime, completionPct, profileId = null) {
    const whereCondition = { user_id: userId, episode_id: episodeId };
    if (profileId) whereCondition.profile_id = profileId;

    const [record, created] = await WatchHistory.findOrCreate({
      where: whereCondition,
      defaults: {
        user_id: userId,
        profile_id: profileId,
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
        ...(profileId ? { profile_id: profileId } : {}),
      });
    }

    return record;
  }

  async getEpisodeProgress(userId, episodeId, profileId = null) {
    const whereCondition = { user_id: userId, episode_id: episodeId };
    if (profileId) whereCondition.profile_id = profileId;
    return WatchHistory.findOne({ where: whereCondition });
  }

  async upsertMovieProgress(userId, movieId, watchTime, completionPct, profileId = null) {
    const whereCondition = { user_id: userId, movie_id: movieId, episode_id: null };
    if (profileId) whereCondition.profile_id = profileId;

    const [record, created] = await WatchHistory.findOrCreate({
      where: whereCondition,
      defaults: {
        user_id: userId,
        profile_id: profileId,
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
        ...(profileId ? { profile_id: profileId } : {}),
      });
    }

    return record;
  }

  async getMovieProgress(userId, movieId, profileId = null) {
    const whereCondition = { user_id: userId, movie_id: movieId, episode_id: null };
    if (profileId) whereCondition.profile_id = profileId;
    return WatchHistory.findOne({ where: whereCondition });
  }
}

module.exports = new WatchProgressRepository();
