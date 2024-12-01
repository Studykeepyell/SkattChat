const express = require('express');
const { getOpinion } = require('../controllers/opinionController');
const router = express.Router();

router.post('/get-opinion', getOpinion);

module.exports = router;
