const express = require('express');
const router = express.Router();
const shareController = require('./share.controller');

router.post('/shorten', shareController.shorten.bind(shareController));
router.get('/:code', shareController.resolve.bind(shareController));

module.exports = router;
