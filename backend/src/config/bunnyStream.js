require('dotenv').config();

const bunnyConfig = {
  apiKey: process.env.BUNNY_API_KEY,
  libraryId: process.env.BUNNY_LIBRARY_ID,
  storageZone: process.env.BUNNY_STORAGE_ZONE,
  hostname: process.env.BUNNY_HOSTNAME,
  // Pull Zone Token Authentication key (CDN → Security → Token Authentication)
  tokenKey: process.env.BUNNY_TOKEN_KEY,
  // Bunny Stream API — video.bunnycdn.com (NOT api.bunny.net)
  baseUrl: `https://video.bunnycdn.com/library/${process.env.BUNNY_LIBRARY_ID}`,
};

module.exports = bunnyConfig;
