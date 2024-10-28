const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
if (!fs.existsSync('users/assets/uploads')) {
    fs.mkdirSync('users/assets/uploads');
}

// Define file storage and file name generation logic
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'users/assets/uploads');  // Specify upload directory
    },
    filename: (req, file, cb) => {
        // Generate a unique filename with the original file extension
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Set up multer with file type validation
const uploads = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        // Validate file type (e.g., only allow images)
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

module.exports = { uploads };
