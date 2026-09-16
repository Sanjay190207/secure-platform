const multer = require('multer');

// Configure Multer Memory Storage (for memory buffer hashing & encryption before saving)
const storage = multer.memoryStorage();

// File filter enforcing PDF document format
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['application/pdf'];
  const isPdfExt = file.originalname.toLowerCase().endsWith('.pdf');

  if (allowedMimeTypes.includes(file.mimetype) && isPdfExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only secure PDF documents (.pdf) are allowed.'), false);
  }
};

// 10MB Max File Size Limit
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Middleware wrapper for better error handling
function uploadPaperPdf(req, res, next) {
  const singleUpload = upload.single('paperFile');

  singleUpload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File size exceeds 10MB limit. Upload a smaller PDF document.' });
      }
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    next();
  });
}

module.exports = { uploadPaperPdf };
