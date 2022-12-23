const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController');

router.post('/addreviews', reviewController.addReviews)

module.exports = router