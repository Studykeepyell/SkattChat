const multer = require('multer');
const path = require('path');
const User = require('../models/User');

// Configure Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.originalname}`),
});
const upload = multer({ storage });

exports.upload = upload.single('profileImage');

// Handle profile image upload
exports.uploadProfileImage = async (req, res) => {
    const imageUrl = `/uploads/${req.file.filename}`;
    try {
        const user = await User.findByIdAndUpdate(req.params.userId, { profileImage: imageUrl }, { new: true });
        if (user) {
            res.json({ success: true, imageUrl });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};

// Get profile image
exports.getUserProfileImage = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (user) {
            res.json({ success: true, profileImage: user.profileImage });
        } else {
            res.status(404).json({ success: false, message: 'Profile image not found.' });
        }
    } catch (error) {
        console.error('Error fetching profile image:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
};
