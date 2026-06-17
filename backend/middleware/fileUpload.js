const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Local Multer Storage
const uploadDirectory = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDirectory);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|pdf/;
  const ext = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mime = allowedExtensions.test(file.mimetype);

  if (ext && mime) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, jpeg, png) and PDFs are allowed'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Configure Cloudinary if keys are available
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Middleware wrapper that handles optional Cloudinary upload
const handleUpload = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  // Set local path as default url
  const localRelativePath = `/uploads/${req.file.filename}`;
  req.file.fileUrl = localRelativePath;
  req.file.publicId = null;

  if (isCloudinaryConfigured) {
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'warrantyhub_documents',
        resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image'
      });
      
      req.file.fileUrl = result.secure_url;
      req.file.publicId = result.public_id;
      
      // Remove local file since it's on Cloudinary now
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting local file after Cloudinary upload:', err);
      });
    } catch (error) {
      console.error('Cloudinary upload error, using local fallback:', error);
      // Fallback is already set to localRelativePath
    }
  }
  next();
};

module.exports = {
  upload,
  handleUpload
};
