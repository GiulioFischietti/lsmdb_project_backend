const { ObjectId } = require("mongodb");
const { MongoCollection } = require("../config/mongoCollection");

class Review {
    static mongoCollection = new MongoCollection({ collection: "reviews" })
    static entityCollection = new MongoCollection({ collection: "reviews" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.username = data.username;
        this.description = data.description;
        this.rate = data.rate;
        this.images = data.images;
        this.propic = data.propic;
        this.createdAt = data.createdAt;
        this.entity_id = data.entity_id;
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
        const reviewToAdd = new Review(review);
        this.mongoCollection.insert(reviewToAdd);
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