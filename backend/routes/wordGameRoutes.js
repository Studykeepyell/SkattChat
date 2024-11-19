const express = require('express');
const { checkWord } = require('../controllers/wordGameController');
const router = express.Router();

router.get('/check-word', checkWord);

module.exports = router;
