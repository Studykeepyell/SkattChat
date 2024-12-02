const express = require('express');
const { uploadProfileImage, getUserProfileImage, upload } = require('../controllers/fileUploadController');
const router = express.Router();

router.post('/uploadProfileImage/:userId', upload, uploadProfileImage);
router.get('/getUserProfileImage/:userId', getUserProfileImage);

module.exports = router;
