const { ObjectId } = require('mongodb')
const { Review } = require('../models/review')

const addReviews = async (req, res) => {
    try {
        var reviews_to_add = []
        for (let i = 0; i < req.body.reviews.length; i++) {
            req.body.reviews[i].entity_id = ObjectId(req.body.reviews[i].entity_id)
            req.body.reviews[i].createdAt = (new Date(req.body.reviews[i].createdAt))

            const reviewToCheck = new Review(req.body.reviews[i])
            const isDuplicate = await Review.isDuplicate(reviewToCheck)
            if (!isDuplicate) {
                reviews_to_add.push(req.body.reviews[i])
            }
        }

        if (reviews_to_add.length > 0) {
            const reviewsAdded = await Review.uploadReviews(req.body.reviews.map((item) => new Review))
            // await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(reviews_to_add[0].entity_id) }, { $set: { retrieved_reviews: true } })
        }

    } catch (e) {
        res.status(500).send({ "success": false, "data": null })
    }
    console.log("added" + reviews_to_add.length)
    res.status(200).send({ "success": true, "data": "added" + reviews_to_add.length })
}

const addReview = async (req, res) => {
    try {
        Review.createReview(req.body.review)
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
    }
}
const recalculateReviewIds = async (req, res) => {
    await Review.recalculateReviewIds();
    res.status(200).send({ "success": true, "data": null })
}

module.exports = {
    addReviews,
    recalculateReviewIds,
    addReview
}