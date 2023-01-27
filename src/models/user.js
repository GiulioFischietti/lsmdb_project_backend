const { MongoCollection } = require('../config/mongoCollection');
const { ObjectId } = require("mongodb");
const { RegisteredUser } = require('./registeredUser');

class User extends RegisteredUser {
    static mongoQueryBuilder = new MongoCollection({ collection: "users" })
    constructor(data) {
        super(data)
        if (data == null) return null
        this.role = "user"
        this.reviews = data.reviews != null ? data.reviews : [];
        this.nFollowers = data.nFollowers != null ? data.nFollowers : 0
        this.nLikes = data.nLikes != null ? data.nLikes : 0
        this.nFollowings = data.nFollowings != null ? data.nFollowings : 0
    }

    static increaseFollowerNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowers: 1 } })
    }
    
    static decreaseFollowerNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowers: -1 } })
    }

    static increaseFollowingNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowings: 1 } })
    }

    static decreaseFollowingNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowings: -1 } })
    }

    static increaseLikesNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nLikes: 1 } })
    }

    static decreaseLikesNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nLikes: -1 } })
    }

    static likeEvent = async (userId, eventId, start) => {

        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $addToSet: { likesEvents: { _id: ObjectId(eventId), "start": new Date(start) } } })
    }

    static dislikeEvent = async (userId, eventId, start) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $pull: { likesEvents: { _id: ObjectId(eventId), "start": new Date(start) } } })
    }

    static followEntity = async (userId, entityId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $addToSet: { followingEntities: ObjectId(entityId) } })
    }

    static unFollowEntity = async (userId, entityId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $pull: { followingEntities: ObjectId(entityId) } })
    }


    static addReviewedEntity = async (userId, entityId) => {
        this.mongoQueryBuilder.updateOne({ _id: userId }, { $addToSet: { reviewedEntities: entityId } })

    }

    static removePastLikedEvents = async () => {
        console.log("Removing old liked events...")
        this.mongoQueryBuilder.updateMany({ "likesEvents.start": { $lte: new Date() } }, { $pull: { likesEvents: { start: { $lte: new Date() } } } })
        console.log("Done")
    }
}

module.exports = { User }