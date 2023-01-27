const { ObjectId, Db } = require('mongodb');
const { MongoCollection } = require('../config/mongoCollection');
const { EventMinimal } = require('./EventMinimal');
// const buildEntity = require('./entityBuilder')
const { Review } = require('./review');

class Entity {

    static mongoCollection = new MongoCollection({ collection: "entities" })
    // static eventsCollection = new MongoCollection({ collection: "events" })
    static reviewCollection = new MongoCollection({ collection: "reviews" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.name = data.name;
        this.description = data.description;
        this.relevance = data.relevance != null ? data.relevance : 0;
        this.image = data.image;
        this.socialMedias = data.socialMedias != null ? data.socialMedias : [];
        this.type = data.type;
        this.createdAt = data.createdAt != null ? data.createdAt : new Date();
        this.facebookLinks = data.facebookLinks != null ? data.facebookLinks : [];
        this.email = data.email;
        this.phones = data.phones != null ? data.phones : [];
        this.avgRate = data.avgRate != null ? data.avgRate : 0;
        this.reviewedByUser = data.reviewedByUser;
        this.followedByUser = data.followedByUser;
        this.followedBy = data.followedBy != null ? data.followedBy : [];
        this.loginNeeded = data.loginNeeded != null ? data.loginNeeded : false;
        this.facebookDescription = data.facebookDescription;
        this.websites = data.websites != null ? data.websites : [];
        this.reviews = data.reviews != null ? data.reviews.map((item) => new Review(item)) : []
        this.upcomingEvents = data.upcomingEvents != null ? data.upcomingEvents.map((item) => new EventMinimal(item)) : []
        this.reviewIds = data.reviewIds != null ? data.reviewIds : []

        if (this.followedByUser == null) delete this.followedByUser
        if (this.reviewedByUser == null) delete this.reviewedByUser
    }

    static addReviewedBy = async (entityId, userId) => {
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $addToSet: { reviewedBy: ObjectId(userId) } });
    }
    static deleteReviewedBy = async (entityId, userId) => {
        // console.log(userId)
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $pull: { reviewedBy: ObjectId(userId) } });
    }

    static getClubsToScrape = async () => {
        return await this.mongoCollection.find({ type: "club", "location": { $exists: true }, "address": { $exists: true, $nin: ["", null] } }).sort({ lastUpdatedEvent: 1 }).toArray()
    }

    static getEntitiesToUpdate = async () => {
        return await this.mongoCollection.find({ type: "club", address: { $in: [null, ""] }, "location.coordinates": { $exists: false } }).toArray()
    }

    static searchEntities = async (parameters, skip) => {
        const response = await this.mongoCollection.find(parameters).skip(skip).limit(5).toArray()
        return response.map((item) => new Entity(item))
    }

    static loadUpcomingEvent = async (addedEvent) => {
        
        var entitiesToUpdate = addedEvent.organizers.concat(addedEvent.artists)
        for (let i = 0; i < entitiesToUpdate.length; i++) {
            console.log(entitiesToUpdate[i]._id)
            this.mongoCollection.updateOne({ _id: ObjectId(entitiesToUpdate[i]._id) }, { $addToSet: { upcomingEvents: new EventMinimal(addedEvent) } })
        }
    }

    static updateUpcomingEvent = async (id, event) => {
        var entitiesToUpdate = event.organizers.concat(event.artists)
        for (let i = 0; i < entitiesToUpdate.length; i++) {
            // console.log(entitiesToUpdate[i]._id)
            this.mongoCollection.updateOne({ _id: ObjectId(entitiesToUpdate[i]._id), "upcomingEvents._id": ObjectId(id) }, { $set: { "upcomingEvents.$": new EventMinimal(event) } })
        }
    }

    static updateUpcomingEvents = async () => {
        console.log("Updating upcoming events...")
        this.mongoCollection.updateMany({ "upcomingEvents.start": { $lte: new Date() } }, { $pull: { upcomingEvents: { start: { $lte: new Date() } } } })
        console.log("Done")
    }

    static entityById = async (req) => {
        const entity = await this.mongoCollection.aggregate([{
            $match: { _id: ObjectId(req.query._id) }
        },
        {
            $addFields: {
                followedByUser: { $in: [ObjectId(req.query.userId), "$followedBy"] },
                reviewedByUser: { $in: [ObjectId(req.query.userId), "$reviewedBy"] }
            }
        }
        ]).toArray()
        return entity[0];
    }

    static entitiesByType = async (type) => {
        const entity = await this.mongoCollection.find({
            type: type
        }).sort({ lastUpdatedEvent: 1 }).toArray()
        return entity;
    }

    static entitiesWithLocation = async (req) => {
        const entities = await this.mongoCollection.find(
            {
                location: { $exists: true },
                address: { $exists: true }
            }).toArray()


        return entities;
    }

    static entityByFacebook = async (facebookLink) => {
        const entity = await this.mongoCollection.findOne({
            facebookLinks: facebookLink
        })
        return entity
    }

    static followEntity = async (entityId, userId) => {
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $addToSet: { followedBy: ObjectId(userId) } })
    }

    static unfollowEntity = async (entityId, userId) => {
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $pull: { followedBy: ObjectId(userId) } })
    }

    static loadEntity = async (entityToAdd) => {
        const entity = await this.mongoCollection.findOne({ name: entityToAdd.name, description: entityToAdd.description })
        if (entity == null) {
            const response = await this.mongoCollection.insertOne(entityToAdd)
            return response.insertedId;
        }
        else {
            this.mongoCollection.updateOne({ _id: ObjectId(entity._id) }, { $addToSet: { facebookLinks: { $each: entityToAdd.facebookLinks } } })
            // console.log(entityToAdd.facebookLinks)
            return entity._id
        }
    }

    static addReviewEmbedded = async (reviewToAdd, entityId) => {
        await this.mongoCollection.updateOne({ _id: entityId }, { $push: { reviewIds: { $each: [reviewToAdd._id], $position: 0 }, reviews: { $each: [reviewToAdd], $position: 0 } } })
        const entity = await this.mongoCollection.findOne({ _id: entityId })

        if (entity.reviews.length > 10) {
            this.mongoCollection.updateOne({ _id: entityId }, { $pull: { reviews: entity.reviews[10] } })
        }
    }

    static editReviewEmbedded = async (reviewEdited, entityId, reviewId) => {
        // console.log(reviewEdited._id)
        this.mongoCollection.updateOne(
            { _id: ObjectId(entityId), "reviews._id": ObjectId(reviewId) },
            {
                $set: {
                    "reviews.$.updatedAt": new Date(),
                    "reviews.$.rate": reviewEdited.rate,
                    "reviews.$.description": reviewEdited.description
                }
            })
    }

    static deleteReviewEmbedded = async (entityId, reviewId) => {
        // console.log(entityId, reviewId, "aooo")
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $pull: { "reviewIds": ObjectId(reviewId) } })
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $pull: { "reviews": { "_id": ObjectId(reviewId) } } })
    }

    static updateEntityDateTime = async (id) => {
        this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $set: { lastUpdatedEvent: new Date() } });
    }

    static updateEntity = async (id, entity) => {
        this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $set: entity });
    }

    static topRatedEntities = async (skip) => {
        skip = parseInt(skip)
        const response = await this.reviewCollection.aggregate([
            {
                $group: {
                    _id: "$entity",
                    count: {
                        $sum: 1,
                    },
                    avgRate: {
                        $avg: "$rate",
                    },
                },
            },
            {
                $match: {
                    count: {
                        $gte: 10,
                    },
                },
            },
            {
                $addFields: {
                    logCountSum: {
                        $sum: [
                            {
                                $log10: "$count",
                            },
                            1,
                        ],
                    },
                },
            },
            {
                $addFields: {
                    relevance: {
                        $multiply: ["$avgRate", "$logCountSum"],
                    },
                },
            },

            {
                $sort: {
                    relevance: -1,
                },
            },
            { $skip: skip },
            { $limit: 10 },
        ]).toArray()

        var json = response.map((item) => {
            var result = {};
            result = item._id;
            result.avgRate = item.avgRate;
            result.relevance = item.relevance;
            return result
        })


        return json.map((item) => { return new Entity(item) })
    }
}

module.exports = {
    Entity
}