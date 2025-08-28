const multer = require('multer');

// Use memory storage for direct buffer access
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter triggered for file:', file.originalname);
    // Allow only image files - including modern formats
    const allowedTypes = /jpeg|jpg|png|gif|webp|avif|svg/;
    const extname = allowedTypes.test(require('path').extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'image/avif';
    if (mimetype && extname) {
      console.log('File accepted:', file.originalname);
      return cb(null, true);
    } else {
      console.log('File rejected:', file.originalname);
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Add middleware logging for array upload
const uploadArrayWithLogging = (req, res, next) => {
  console.log('=== MULTER MIDDLEWARE (ARRAY) ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.log('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    console.log('Multer processed files:', req.files ? req.files.length : 0);
    if (req.files) {
      req.files.forEach((file, index) => {
        console.log(`File ${index}:`, file.originalname, file.size, 'bytes');
      });
    }
    console.log('=================================');
    next();
  });
};

// Add middleware logging for single upload
const uploadSingleWithLogging = (fieldName) => (req, res, next) => {
  console.log('=== MULTER MIDDLEWARE (SINGLE) ===');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Field name:', fieldName);
  
  upload.single(fieldName)(req, res, (err) => {
    if (err) {
      console.log('Multer error:', err.message);
      return res.status(400).json({ error: err.message });
    }
    console.log('Multer processed file:', req.file ? req.file.originalname : 'none');
    if (req.file) {
      console.log('File details:', req.file.originalname, req.file.size, 'bytes');
    }
    console.log('==================================');
    next();
  });
};

module.exports = { 
  upload: {
    single: uploadSingleWithLogging,
    array: () => uploadArrayWithLogging
  }
};
