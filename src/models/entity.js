const { ObjectId, Db } = require('mongodb');
const { MongoCollection } = require('../config/mongoCollection');
const { neo4jClient } = require('../config/neo4jDB');
const { EntityMinimal } = require('./entityMinimal');
const { EventMinimal } = require('./EventMinimal');
// const buildEntity = require('./entityBuilder')
const { Review } = require('./review');

class Entity {

    static mongoCollection = new MongoCollection({ collection: "entities" })
    // static eventsCollection = new MongoCollection({ collection: "events" })
    static reviewCollection = new MongoCollection({ collection: "reviews" })

    constructor(data) {
        if (data == null) return null
        this._id = ObjectId(data._id);
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
        this.reviewedBy = data.reviewedBy != null ? data.reviewedBy : [];
        this.nFollowers = data.nFollowers != null ? data.nFollowers : 0;
        this.loginNeeded = data.loginNeeded != null ? data.loginNeeded : false;
        this.facebookDescription = data.facebookDescription;
        this.websites = data.websites != null ? data.websites : [];
        this.reviews = data.reviews != null ? data.reviews.map((item) => new Review(item)) : []
        this.upcomingEvents = data.upcomingEvents != null ? data.upcomingEvents.map((item) => new EventMinimal(item)) : []
        this.reviewIds = data.reviewIds != null ? data.reviewIds : []

        if (this.followedByUser == null) delete this.followedByUser
        if (this.reviewedByUser == null) delete this.reviewedByUser
    }



    static updateEntityOnNeo4j = async (id, entity) => {
        return await neo4jClient.run(`
            match(e:Entity {_id: "$id"})
            set e.name = "$name",
            e.image = "$image"`
            .replace("$id", id)
            .replace("$name", entity.name)
            .replace("$image", entity.image)
        )
    }



    static addReviewedBy = async (entityId, userId) => {
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $addToSet: { reviewedBy: ObjectId(userId) } });
    }

    static deleteReviewedBy = async (entityId, userId) => {
        // console.log(userId)
        this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $pull: { reviewedBy: ObjectId(userId) } });
    }

    static getClubsToScrape = async () => {
        //  }).sort({ lastUpdatedEvent: 1 

        return await this.mongoCollection.find({
            type: "club", "description": { $ne: null }, "location": { $exists: true }, "address": { $exists: true, $nin: ["", null] },
        }).sort({ lastUpdatedEvent: 1 }).toArray()
    }

    static getEntitiesToUpdate = async () => {
        return await this.mongoCollection.find({ type: "club", address: { $in: [null, ""] }, "location.coordinates": { $exists: false } }).toArray()
    }

    static searchEntities = async (parameters, skip, limit) => {
        const response = await this.mongoCollection.find(parameters).skip(skip).limit(limit).toArray()
        return response.map((item) => new Entity(item))
    }

    static loadUpcomingEvent = async (addedEvent) => {

        var entitiesToUpdate = addedEvent.organizers.concat(addedEvent.artists)
        for (let i = 0; i < entitiesToUpdate.length; i++) {
            // console.log(entitiesToUpdate[i]._id)
            this.mongoCollection.updateOne({ _id: ObjectId(entitiesToUpdate[i]._id) }, { $addToSet: { upcomingEvents: new EventMinimal(addedEvent) } })
        }
    }

    static getSuggestedEntities = async (userId, skip) => {
        const response = await neo4jClient.run(
            `MATCH (me:User{_id: "$userId"})-[f:FOLLOWS]->(u:User)-[l:FOLLOWS]->(e:Entity)
            WITH count(l) as followsCount, me , e
            ORDER BY followsCount desc
            WHERE NOT EXISTS((me)-[:FOLLOWS]->(e))
            RETURN e
            SKIP $skip LIMIT 10`
                .replace("$skip", skip)
                .replace("$userId", userId)
        )
        return response.records.map((item) => { return new EventMinimal({ ...item.toObject().e.properties, "start": item.toObject().e.properties.date_start }) })
    }

    static getSuggestedArtistsForCooperation = async (entityId, skip) => {
        const response = await neo4jClient.run(`
        match (c:Entity {_id: "$entityId"})-[h:ORGANIZES]->(e:Event)<-[org:ORGANIZES]-(o:Entity)
        match (o)-[org2:ORGANIZES]->(e2: Event)<-[p:PLAYS_IN]-(a:Entity)
        where not exists ((c)-[:ORGANIZES]->(e2)<-[:PLAYS_IN]-(a)) and not exists ((c)-[:ORGANIZES]->(e)<-[:PLAYS_IN]-(a))
        return a
        skip $skip
        limit 10`
            .replace("$entityId", entityId)
            .replace("$skip", skip)
        )
        return response.records.map((item) => { return new EntityMinimal(item.toObject().a.properties) })
    }

    static updateUpcomingEvent = async (id, event) => {
        var entitiesToUpdate = event.organizers.concat(event.artists)
        for (let i = 0; i < entitiesToUpdate.length; i++) {
            // console.log(entitiesToUpdate[i]._id)
            await this.mongoCollection.updateOne({ _id: ObjectId(entitiesToUpdate[i]._id), "upcomingEvents._id": ObjectId(id) }, { $set: { "upcomingEvents.$": new EventMinimal(event) } })
        }
        return true
    }

    static deleteUpcomingEvent = async (id, event) => {
        var entitiesToUpdate = event.organizers.concat(event.artists)
        for (let i = 0; i < entitiesToUpdate.length; i++) {
            // console.log(entitiesToUpdate[i]._id)
            this.mongoCollection.updateOne({ _id: ObjectId(entitiesToUpdate[i]._id), "upcomingEvents._id": ObjectId(id) }, { $pull: { "upcomingEvents": new EventMinimal(event) } })
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

    static getEntityById = async (id) => {
        return await this.mongoCollection.findOne({ _id: ObjectId(id) })
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

    static followEntityMongoDB = async (entityId, userId) => {
        console.log(entityId)
        return await this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $inc: { nFollowers: 1 }, $push: { followedBy: ObjectId(userId) } },)
    }

    static unfollowEntityMongoDB = async (entityId, userId) => {
        return await this.mongoCollection.updateOne({ _id: ObjectId(entityId) }, { $inc: { nFollowers: -1 }, $pull: { followedBy: ObjectId(userId) } },)
    }

    static followEntityNeo4j = async (userId, entityId) => {
        return await neo4jClient.run(`MATCH (n:User {_id: "$userId"})
                 MATCH(m: Entity { _id: "$entityId" })
                 create(n) -[:FOLLOWS] -> (m)`
            .replace("$userId", userId)
            .replace("$entityId", entityId))
    }

    static unfollowEntityNeo4j = async (userId, entityId) => {
        return await neo4jClient.run(`MATCH (n:User {_id: "$userId"})-[r:FOLLOWS] ->(m: Entity { _id: "$entityId" }) delete r`
            .replace("$userId", userId)
            .replace("$entityId", entityId))
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

    static updateEmbeddedUserInEntity = async (id, user) => {
        return await this.mongoCollection.updateMany({ "reviews.user._id": ObjectId(id) }, { $set: { "reviews.$.user.username": user.username, "reviews.$.user.image": user.image } })
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
        return await this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $set: entity });
    }

    static topRatedEntities = async (skip) => {
        skip = parseInt(skip)
        const response = await this.mongoCollection.aggregate([
            {
                $match: {
                    "reviewIds.0": {
                        $exists: true,
                    },
                },
            },
            {
                $project:
                {
                    name: 1,
                    image: 1,
                    type: 1,
                    reviewIds: 1,
                    avgRate: 1,
                },
            },
            {
                $addFields: {
                    logCount: {
                        $log10: {
                            $sum: [
                                {
                                    $size: "$reviewIds",
                                },
                                1,
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    name: 1,
                    image: 1,
                    type: 1,
                    avgRate: 1,
                    score: {
                        $multiply: ["$logCount", "$avgRate"],
                    },
                },
            },
            {
                $sort:
                {
                    score: -1,
                },
            },
            {
                $skip:
                    skip,
            },
            {
                $limit:
                    10,
            },
        ]).toArray()




        return response.map((item) => { return new EntityMinimal(item) })
    }



}

module.exports = {
    Entity
}