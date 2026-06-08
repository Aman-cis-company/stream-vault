const UserInteractionRepository = require('../repositories/UserInteractionRepository');

class UserInteractionService {
  async getStatus(userId, contentType, contentId) {
    const record = await UserInteractionRepository.findOne(userId, contentType, Number(contentId));
    return {
      is_liked: record?.is_liked ?? false,
      in_list: record?.in_list ?? false,
    };
  }

  async toggleLike(userId, contentType, contentId) {
    const record = await UserInteractionRepository.upsertToggleLike(userId, contentType, Number(contentId));
    return { is_liked: record.is_liked };
  }

  async toggleList(userId, contentType, contentId) {
    const record = await UserInteractionRepository.upsertToggleList(userId, contentType, Number(contentId));
    return { in_list: record.in_list };
  }

  async getMyList(userId) {
    return UserInteractionRepository.getList(userId);
  }

  async getLiked(userId) {
    return UserInteractionRepository.getLiked(userId);
  }
}

module.exports = new UserInteractionService();
