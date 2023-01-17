const { Review } = require("./review");
const { MongoCollection } = require('../config/mongoCollection');
const { ObjectId } = require("mongodb");

class User {
    static mongoQueryBuilder = new MongoCollection({ collection: "users" })
    constructor(data) {
        console.log(data)
        if (data == null) return null
        this._id = data._id;
        this.name = data.name;
        this.password = data.password;
        this.birthday = data.birthday;
        this.bio = data.bio;
        this.image = data.image;
        this.username = data.username;
        this.reviews = data.reviews != null ? data.reviews : [];
        this.followingEntities = data.followingEntities != null ? data.followingEntities : [];
        this.followingUsers = data.followingUsers != null ? data.followingUsers : [];
        this.likesEvents = data.likesEvents != null ? data.likesEvents : [];

        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static getUserByUsername = async (req) => {
        const user = await this.mongoQueryBuilder.findOne({ username: req.body.username });
        return new User(user)
    }

    static likeEvent = async (userId, eventId, start) => {
        
        this.mongoQueryBuilder.updateOne({_id: ObjectId(userId)}, {$addToSet: {likesEvents:{_id: ObjectId(eventId), "start": new Date(start)}}})
    }

    static dislikeEvent = async (userId, eventId, start) => {
        this.mongoQueryBuilder.updateOne({_id: ObjectId(userId)}, {$pull: {likesEvents:{_id: ObjectId(eventId), "start": new Date(start)}}})
    }

    static followEntity = async (userId, entityId) => {
        this.mongoQueryBuilder.updateOne({_id: ObjectId(userId)}, {$addToSet: {followingEntities: ObjectId(entityId)}})
    }

    static unFollowEntity = async (userId, entityId) => {
        this.mongoQueryBuilder.updateOne({_id: ObjectId(userId)}, {$pull: {followingEntities: ObjectId(entityId)}})
    }

    static createUser = async (userData, hashedPassword) => {
        userData.createdAt = new Date()
        userData.updatedAt = new Date()
        const response = await this.mongoQueryBuilder.insertOne(new User(userData))
        return response
    }

    static userById = async (req) => {
        const response = await this.mongoQueryBuilder.findOne({
            _id: ObjectId(req.query._id)
        })
        return new User(response)
    }

    static updateUser = async (params) => {
        const response = await this.mongoQueryBuilder.updateOne({
            _id: ObjectId(req.body._id)
        }, { $set: params }, { upsert: false })
        return response
    }

    static removePastLikedEvents = async () => {
        console.log("Removing old liked events...")
        this.mongoQueryBuilder.updateMany({ "likesEvents.start": { $lte: new Date() } }, { $pull: { likesEvents: { start: { $lte: new Date() } } } })
        console.log("Done")
    }
}

module.exports = { User }