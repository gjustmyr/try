const multer = require("multer");
const path = require("path");

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/temp/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPG, PNG, and PDF files are allowed."),
      false,
    );
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Middleware for seller registration files
const uploadSellerDocuments = upload.fields([
  { name: "governmentId", maxCount: 1 },
  { name: "businessLicense", maxCount: 1 },
  { name: "proofOfAddress", maxCount: 1 },
  { name: "taxCertificate", maxCount: 1 },
]);

// Middleware for product images
const uploadProductImages = upload.array("images", 5); // Max 5 images

module.exports = { uploadSellerDocuments, uploadProductImages };
