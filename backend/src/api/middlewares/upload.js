const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { errorResponse } = require('../../helpers/responseHelper');

const UPLOAD_PATH = process.env.UPLOAD_PATH || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 524288000; // 500MB

// Ensure required upload directories exist at startup
fs.mkdirSync(path.join(UPLOAD_PATH, 'thumbnails'), { recursive: true });
fs.mkdirSync(path.join(UPLOAD_PATH, 'videos'), { recursive: true });

// ── Thumbnail storage ─────────────────────────────────────────────────────────
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_PATH, 'thumbnails'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `thumb-${uuidv4()}${ext}`);
  },
});

const thumbnailFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Only image files are allowed for thumbnails (jpg, jpeg, png, webp, gif).'), false);
  }
  cb(null, true);
};

// ── Video storage (goes to uploads/videos/ — kept for local, deleted after Bunny upload) ──
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(UPLOAD_PATH, 'videos'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `video-${uuidv4()}${ext}`);
  },
});

const videoFilter = (req, file, cb) => {
  const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (!allowed.includes(ext)) {
    return cb(new Error('Only video files are allowed (mp4, mov, avi, mkv, webm).'), false);
  }
  cb(null, true);
};

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: thumbnailFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
});

const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

const uploadMovieFiles = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'thumbnail') {
        cb(null, path.join(UPLOAD_PATH, 'thumbnails'));
      } else {
        cb(null, path.join(UPLOAD_PATH, 'videos'));
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const prefix = file.fieldname === 'thumbnail' ? 'thumb' : 'video';
      cb(null, `${prefix}-${uuidv4()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowed.includes(ext)) {
        return cb(new Error('Only image files are allowed for thumbnails.'), false);
      }
    } else if (file.fieldname === 'video') {
      const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowed.includes(ext)) {
        return cb(new Error('Only video files are allowed.'), false);
      }
    }
    cb(null, true);
  },
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Multer error handler middleware.
 */
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, 'File size exceeds the allowed limit.', 400);
    }
    return errorResponse(res, `Upload error: ${err.message}`, 400);
  }
  if (err) {
    return errorResponse(res, err.message, 400);
  }
  next();
};

module.exports = {
  uploadThumbnail,
  uploadVideo,
  uploadMovieFiles,
  handleMulterError,
};
