const express = require('express');
const router = express.Router();
const { register, login, logout, searchUsers, updateProfile } = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/search', searchUsers);
router.put('/:userId', updateProfile);

module.exports = router;

