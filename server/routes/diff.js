const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { getDiff } = require('../controllers/diffController');

router.get('/', protect, getDiff);

module.exports = router;
