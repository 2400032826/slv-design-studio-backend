const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Ensure local uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Disk storage fallback function
const createDiskStorage = () =>
  multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/quicktime',
    'application/pdf',
    'application/postscript',
    'application/octet-stream',
  ];
  if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(ai|cdr|pdf|jpg|jpeg|png|webp|gif)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file format'), false);
  }
};

const hasCloudinaryEnv = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

let productStorage, galleryStorage, customizationStorage, singleStorage;

if (hasCloudinaryEnv) {
  try {
    const cloudinary = require('../config/cloudinary');
    const { CloudinaryStorage } = require('multer-storage-cloudinary');

    productStorage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'slv-design-studio/products', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4'] },
    });
    galleryStorage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'slv-design-studio/gallery', allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4'] },
    });
    customizationStorage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'slv-design-studio/customizations', resource_type: 'raw' },
    });
    singleStorage = new CloudinaryStorage({
      cloudinary,
      params: { folder: 'slv-design-studio/misc', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
    });
  } catch (e) {
    console.warn('⚠️ Cloudinary setup failed, falling back to local disk storage:', e.message);
  }
}

if (!productStorage) productStorage = createDiskStorage();
if (!galleryStorage) galleryStorage = createDiskStorage();
if (!customizationStorage) customizationStorage = createDiskStorage();
if (!singleStorage) singleStorage = createDiskStorage();

exports.uploadProductImages = multer({
  storage: productStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
}).fields([{ name: 'images', maxCount: 10 }, { name: 'video', maxCount: 1 }]);

exports.uploadGallery = multer({
  storage: galleryStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter,
}).array('media', 20);

exports.uploadCustomization = multer({
  storage: customizationStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter,
}).fields([
  { name: 'referenceImages', maxCount: 5 },
  { name: 'logo', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'designFile', maxCount: 1 },
  { name: 'measurements', maxCount: 1 },
  { name: 'samplePhoto', maxCount: 1 },
]);

exports.uploadSingle = multer({
  storage: singleStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
}).single('image');
