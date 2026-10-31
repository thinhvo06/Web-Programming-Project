const multer = require('multer');
const path = require('path');
const fs = require('fs');

const avatarsDir = path.resolve(__dirname, '../../uploads/avatars');
const attachmentsDir = path.resolve(__dirname, '../../uploads/attachments');

// Ensure directories exist
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Storage for Avatar
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${req.user ? req.user.id : 'temp'}-${uniqueSuffix}${ext}`);
  }
});

// Avatar file filter: only images
const avatarFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ hỗ trợ file ảnh định dạng JPEG, PNG, GIF hoặc WEBP.'), false);
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: avatarFilter
});

// Storage for Attachments
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `attach-${uniqueSuffix}${ext}`);
  }
});

const uploadAttachments = multer({
  storage: attachmentStorage,
  limits: { fileSize: 30 * 1024 * 1024 } // 30MB limit per file
});

module.exports = {
  uploadAvatar,
  uploadAttachments
};
