const { ObjectId } = require("mongodb");
const { MongoCollection } = require("../config/mongoCollection");
const { EntityMinimal } = require("./entityMinimal");
const { UserMinimal } = require("./UserMinimal");

class Review {
    static mongoCollection = new MongoCollection({ collection: "reviews" })
    static entityCollection = new MongoCollection({ collection: "entities" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.description = data.description;
        this.rate = data.rate;
        this.images = data.images;
        this.createdAt = data.createdAt;
        this.entity = new EntityMinimal(data.entity);
        this.user = new UserMinimal(data.user);
    }

    static isDuplicate = async (review) => {
        const reviewToCheck = await this.mongoCollection.findOne({
            username: review.username,
            description: review.description,
            entity_id: review.entity_id
        })
        return reviewToCheck != null
    }

    static createReview = async (review) => {
        var reviewToAdd = new Review(review);
        
        const response = await this.mongoCollection.insertOne(reviewToAdd);
        reviewToAdd._id = ObjectId(response.insertedId);
        var entityId = reviewToAdd.entity._id
        // reviewToAdd.entity = null
        delete reviewToAdd.entity

        await this.entityCollection.updateOne({ _id: entityId }, { $push: { reviewIds: { $each: [reviewToAdd._id], $position: 0 }, reviews: { $each: [reviewToAdd], $position: 0 } } })
        const entity = await this.entityCollection.findOne({ _id: entityId })

        if (entity.reviews.length > 10) {
            this.entityCollection.updateOne({ _id: entityId }, { $pull: { reviews: entity.reviews[10] } })
        }

    }

    static uploadReviews = async (reviewsToAdd) => {
        const addedReviews = await this.mongoCollection.insertMany(reviewsToAdd)
    }

    static recalculateReviewIds = async () => {
        const entityIds = await this.mongoCollection.aggregate([{ $group: { _id: "$entity._id" } }]).toArray()
        console.log(entityIds[0])
        for (let i = 0; i < entityIds.length; i++) {
            if (i % 100 == 0) console.log(i * 100 / 3200)
            var orderedReviewIds = (await this.mongoCollection.find({ _id: ObjectId(entityIds[i]._id) }, { $projection: { _id: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray()).map((item) => { return item._id })
            await this.entityCollection.updateOne({ _id: ObjectId(entityIds[i]._id) }, { $set: { reviewIds: orderedReviewIds } })
        }
    }
}

module.exports = { Review }