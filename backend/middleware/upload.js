const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
const videosDir = path.join(uploadsDir, 'videos');
const filesDir = path.join(uploadsDir, 'files');

[uploadsDir, videosDir, filesDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, videosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const safe = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safe.slice(0, 50)}${ext}`);
  }
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, filesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safe = Buffer.from(file.originalname, 'latin1').toString('utf8').replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${Date.now()}-${safe.slice(0, 50)}${ext}`);
  }
});

const videoFilter = (req, file, cb) => {
  const allowed = ['video/mp4', 'video/webm', 'video/ogg'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only MP4, WebM, OGG videos allowed'), false);
};

const fileFilter = (req, file, cb) => {
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/zip', 'application/x-zip-compressed'];
  if (allowed.includes(file.mimetype) || file.originalname.match(/\.(pdf|doc|docx|zip)$/i)) cb(null, true);
  else cb(new Error('Only PDF, DOC, DOCX, ZIP allowed'), false);
};

exports.uploadVideo = multer({ storage: videoStorage, fileFilter: videoFilter, limits: { fileSize: 100 * 1024 * 1024 } });
exports.uploadFile = multer({ storage: fileStorage, fileFilter: fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });
