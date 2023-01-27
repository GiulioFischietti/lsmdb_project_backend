const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController');

router.post('/addreviews', reviewController.addReviews)
router.post('/addreview', reviewController.addReview)
router.post('/editreview', reviewController.editReview)
router.post('/deletereview', reviewController.deleteReview)
router.get('/recalculateReviewIds', reviewController.recalculateReviewIds)
router.post('/getreviewsbyid', reviewController.getReviewsById)

module.exports = router