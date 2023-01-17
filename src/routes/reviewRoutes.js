const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController');

router.post('/addreviews', reviewController.addReviews)
router.post('/addreview', reviewController.addReview)
router.get('/recalculateReviewIds', reviewController.recalculateReviewIds)

module.exports = router