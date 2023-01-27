const { ObjectId } = require('mongodb')
const { Entity } = require('../models/entity')
const { Review } = require('../models/review')
const { User } = require('../models/user')

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
    // console.log("added" + reviews_to_add.length)
    res.status(200).send({ "success": true, "data": "added" + reviews_to_add.length })
}

const addReview = async (req, res) => {
    try {
        const [reviewCreated, entityId] = await Review.createReview(req.body)
        Entity.addReviewEmbedded(reviewCreated, entityId);
        const avg = await Review.getAvgEntity(entityId)
        Entity.updateEntity(entityId, { "avgRate": avg })
        Entity.addReviewedBy(entityId, req.body.user._id)
        res.status(200).send({ "success": true, "data": { "avg": avg, "reviewId": reviewCreated._id } })
    } catch (error) {
        console.log(error)
    }
}

const editReview = async (req, res) => {
    try {
        const [reviewEdited, entityId] = await Review.editReview(req.body.reviewId, req.body.review)
        await Entity.editReviewEmbedded(reviewEdited, entityId, req.body.reviewId);
        const avg = await Review.getAvgEntity(entityId)
        Entity.updateEntity(entityId, { "avgRate": avg })
        res.status(200).send({ "success": true, "data": { "avg": avg, "reviewId": reviewEdited._id } })
    } catch (error) {
        console.log(error)
    }
}


const recalculateReviewIds = async (req, res) => {
    await Review.recalculateReviewIds();
    res.status(200).send({ "success": true, "data": null })
}

const getReviewsById = async (req, res) => {
    const reviews = await Review.getReviewsById(req.body.reviewIds);
    res.status(200).send({ "success": true, "data": reviews })
}

const deleteReview = async (req, res) => {
    try {

        Entity.deleteReviewEmbedded(req.body.entityId, req.body.reviewId);
        Entity.deleteReviewedBy(req.body.entityId, req.body.userId)
        
        await Review.deleteReview(req.body.reviewId);
        const avg = await Review.getAvgEntity(req.body.entityId)
        Entity.updateEntity(req.body.entityId, { "avgRate": avg })


        res.status(200).send({ "success": true, "data": { "avg": avg } })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

module.exports = {
    addReviews,
    recalculateReviewIds,
    addReview,
    editReview,
    getReviewsById,
    deleteReview
}