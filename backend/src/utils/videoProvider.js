function detectVideoProvider(videoUrl, currentProvider = null) {
  if (!videoUrl) {
    return { provider_name: currentProvider, provider_video_id: null };
  }

  // Detect YouTube
  if (
    videoUrl.includes('youtube.com') ||
    videoUrl.includes('youtu.be') ||
    /^[a-zA-Z0-9_-]{11}$/.test(videoUrl)
  ) {
    // Extract YouTube ID
    const patterns = [
      /youtu\.be\/([^?&\s]+)/,
      /youtube\.com\/watch\?v=([^&\s]+)/,
      /youtube\.com\/embed\/([^?&\s]+)/,
      /youtube\.com\/shorts\/([^?&\s]+)/,
      /youtube\.com\/live\/([^?&\s]+)/,
    ];
    let ytId = null;
    for (const p of patterns) {
      const m = videoUrl.match(p);
      if (m) {
        ytId = m[1];
        break;
      }
    }
    // If it is just an 11 character ID:
    if (!ytId && /^[a-zA-Z0-9_-]{11}$/.test(videoUrl)) {
      ytId = videoUrl;
    }
    return { provider_name: 'youtube', provider_video_id: ytId };
  }

  // Detect Bunny Stream
  if (videoUrl.includes('b-cdn.net') || videoUrl.includes('bunny')) {
    // Extract GUID from URL (e.g. /ba64f77e-5c0b-4df9-aad2-c7810b6177db/playlist.m3u8)
    const m = videoUrl.match(/\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\//);
    const videoId = m ? m[1] : null;
    return { provider_name: 'bunny', provider_video_id: videoId };
  }

  // Detect Local HLS or local MP4
  if (videoUrl.startsWith('/uploads/') || videoUrl.startsWith('uploads/')) {
    return { provider_name: 'local', provider_video_id: null };
  }

  return { provider_name: currentProvider || 'external', provider_video_id: null };
}

module.exports = {
  detectVideoProvider,
};
