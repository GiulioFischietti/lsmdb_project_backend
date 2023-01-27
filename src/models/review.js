const { ObjectId } = require("mongodb");
const { MongoCollection } = require("../config/mongoCollection");
const { EntityMinimal } = require("./entityMinimal");
const { UserMinimal } = require("./UserMinimal");

class Review {
    static mongoCollection = new MongoCollection({ collection: "reviews" })
    // static entityCollection = new MongoCollection({ collection: "entities" })

    constructor(data) {
        if (data == null) return null
        this._id = ObjectId(data._id);
        this.description = data.description != null ? data.description : "";
        this.rate = data.rate;
        this.images = data.images != null ? data.images : [];
        this.createdAt = data.createdAt != null ? data.createdAt : new Date();
        this.updatedAt = data.updatedAt != null ? data.updatedAt : new Date();
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

        return [reviewToAdd, entityId]

    }

    static editReview = async (reviewId, review) => {
        var reviewEdited = new Review(review);
        // console.log(reviewId)
        this.mongoCollection.updateOne({ _id: ObjectId(reviewId) }, { $set: { description: reviewEdited.description, rate: reviewEdited.rate } });
        var entityId = reviewEdited.entity._id
        // reviewEdited.entity = null
        delete reviewEdited.entity
        return [reviewEdited, entityId]
    }

    static deleteReview = async (reviewId) => {
        this.mongoCollection.deleteOne({ _id: ObjectId(reviewId) })
    }

    static getReviewsById = async (reviewIds) => {
        reviewIds = reviewIds.map((item) => ObjectId(item))
        const response = await this.mongoCollection.find({ _id: { $in: reviewIds } }).sort({ createdAt: -1 }).toArray()
        return response.map((item) => { return new Review(item) });
    }

    static getAvgEntity = async (_id) => {
        // console.log(_id)
        const response = await this.mongoCollection.aggregate([
            { $match: { "entity._id": _id } },
            { $group: { _id: "$entity._id", avgRate: { $avg: "$rate" } } }
        ]).toArray()
        // console.log(response[0])
        return response[0] != null ? response[0].avgRate : 0
    }
    static uploadReviews = async (reviewsToAdd) => {
        const addedReviews = await this.mongoCollection.insertMany(reviewsToAdd)
    }
    
    static updateEmbeddedEntity = async (_id, entity) => {
        this.mongoCollection.updateMany({"entity._id": ObjectId(_id)}, {$set: {"entity.name": entity.name, "entity.image": entity.image}})
    }

    // static recalculateReviewIds = async () => {
    //     const entityIds = await this.mongoCollection.aggregate([{ $group: { _id: "$entity._id" } }]).toArray()
    //     console.log(entityIds[0])
    //     for (let i = 0; i < entityIds.length; i++) {
    //         if (i % 100 == 0) console.log(i * 100 / 3200)
    //         var orderedReviewIds = (await this.mongoCollection.find({ _id: ObjectId(entityIds[i]._id) }, { $projection: { _id: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray()).map((item) => { return item._id })
    //         await this.entityCollection.updateOne({ _id: ObjectId(entityIds[i]._id) }, { $set: { reviewIds: orderedReviewIds } })
    //     }
    // }
}

module.exports = { Review }