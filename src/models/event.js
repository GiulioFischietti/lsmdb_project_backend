const { EntityMinimal } = require("./entityMinimal");
const { MongoCollection } = require("../config/mongoCollection");
const { neo4jClient } = require("../config/neo4jDB")
const { ObjectId } = require("mongodb");
const { EventMinimal } = require("./EventMinimal");

function replaceall(str, replace, with_this) {
    if (str == undefined) return str
    var result = str

    while (result.includes(replace)) {
        result = result.replace(replace, with_this)
    }

    return result
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

class Event {
    static eventCollection = new MongoCollection({ collection: "events" })
    static analyticsEventsCollection = new MongoCollection({ collection: "analyticsEvents" })
    static entityCollection = new MongoCollection({ collection: "entities" })

    constructor(data) {
        if (data == null) return null

        this._id = ObjectId(data._id);
        this.name = data.name;
        this.description = data.description;
        this.start = new Date(data.start);
        this.expiresAt = addMinutes(this.start, 300)
        if (data.end != null) {
            this.end = new Date(data.end);
            this.expiresAt = this.end
        }
        this.genres = data.genres;
        this.facebook = data.facebook;
        this.dist = data.dist;
        this.image = data.image;
        this.organizers = data.organizers.map((item) => new EntityMinimal(item));
        this.artists = data.artists.map((item) => new EntityMinimal(item));
        this.club = data.club != null ? new EntityMinimal(data.club) : {};
        this.address = data.address;
        this.likedByUser = data.likedByUser != null ? data.likedByUser : false;
        this.location = data.location;
        this.likedBy = data.likedBy != null ? data.likedBy : []
        this.createdAt = new Date()

        if (this.likedByUser == null) delete this.likedByUser
        if (this.dist == null) delete this.dist
    }

    static updateEmbeddedEntities = async (_id, entity) => {
        this.eventCollection.updateMany({ "club._id": ObjectId(_id) }, { $set: { "club.name": entity.name, "club.image": entity.image } })
        this.eventCollection.updateMany({ "organizers._id": ObjectId(_id) }, { $set: { "organizers.$.name": entity.name, "organizers.$.image": entity.image } })
        this.eventCollection.updateMany({ "artists._id": ObjectId(_id) }, { $set: { "artists.name.$": entity.name, "artists.image.$": entity.image, } })


        this.analyticsEventsCollection.updateMany({ "club._id": ObjectId(_id) }, { $set: { "club.name": entity.name, "club.image": entity.image } })
        this.analyticsEventsCollection.updateMany({ "organizers._id": ObjectId(_id) }, { $set: { "organizers.$.name": entity.name, "organizers.$.image": entity.image } })
        this.analyticsEventsCollection.updateMany({ "artists._id": ObjectId(_id) }, { $set: { "artists.name.$": entity.name, "artists.image.$": entity.image, } })
    }

    static eventById = async (req) => {
        const response = await this.eventCollection.aggregate([
            {
                $match: { _id: ObjectId(req.query._id) }
            },
            { $addFields: { likedByUser: { $in: [ObjectId(req.query.userId), "$likedBy"] } } }]).toArray()
        return new Event(response[0])
    }

    static eventByFacebook = async (req) => {
        const response = await this.eventCollection.findOne({
            facebook: req.query.facebook
        })
        return new Event(response)
    }

    static eventsByEntity = async (entityId, skip) => {
        skip = parseFloat(skip)
        const response = await this.analyticsEventsCollection.find({
            "organizers._id": ObjectId(entityId),
        }).sort({ start: -1 }).skip(skip).limit(10).toArray()
        // console.log(response)
        return response
    }

    static amountEventsScraped = async (req) => {
        const addedToday = await this.eventCollection.countDocuments({
            createdAt: {
                $gte: new Date(new Date() - 60 * 60 * 24 * 1000)
            }
        })
        const events_count = await this.eventCollection.countDocuments({})
        return { events_count, addedToday }
    }

    static recentData = async (req) => {
        const response = await this.eventCollection.find().sort({ createdAt: -1 }).limit(8).toArray()
        return response.map((item) => new Event(item))
    }

    static getAllEvents = async (req) => {
        const response = await this.eventCollection.find({ start: { "$gte": (new Date("2022-01-01")) } }).toArray()
        return response.map((item) => new Event(item))
    }

    static likeEvent = async (eventId, userId) => {
        this.eventCollection.updateOne({ _id: ObjectId(eventId) }, { $addToSet: { likedBy: ObjectId(userId) } })
    }

    static dislikeEvent = async (eventId, userId) => {
        this.eventCollection.updateOne({ _id: ObjectId(eventId) }, { $pull: { likedBy: ObjectId(userId) } })
    }

    static searchEvents = async (parameters, userId, skip) => {
        // db.events.aggregate([{$addFields: {liked: {$in: [ObjectId("638df65605393857c40b8941"), "$likedBy" ]} }}, {$limit: 10}])
        const response = await this.eventCollection.aggregate([parameters, { $addFields: { likedByUser: { $in: [ObjectId(userId), "$likedBy"] } } }, { $sort: { start: 1 } }, { $skip: skip }, { $limit: 5 }]).toArray()
        // console.log(response);
        return response.map((item) => new Event(item))
    }

    static findEventByNameAndStart = async (eventToAdd) => {
        const response = await this.eventCollection.findOne({ name: eventToAdd.name, start: eventToAdd.start })
        return response
    }

    static uploadEventOnMongoDB = async (eventToAdd) => {
        await this.eventCollection.insertOne(eventToAdd)
        const insertedEvent = await this.eventCollection.findOne({ _id: ObjectId(eventToAdd._id) })
        console.log(insertedEvent)
        return insertedEvent
    }

    static updateEventOnMongoDB = async (id, event) => {
        this.eventCollection.updateOne({_id: ObjectId(id)}, {$set: event})
    }

    static uploadEventOnNeo4j = async (eventToAdd) => {
        for (let i = 0; i < eventToAdd.organizers.length; i++) {
            await neo4jClient.run(`MERGE (n:EventNode {object_id: "$object_id", name: "$name", image: "$image", date_start: "$start", genres: "$genres"})
            MERGE(m: EntityNode { object_id: "$entity_object_id", name: "$entity_name", image: "$entity_image", type: "$type" })
            create(m) -[:ORGANIZES] -> (n)`
                .replace("$object_id", eventToAdd._id)
                .replace("$name", replaceall(eventToAdd.name, '"', ''))
                .replace("$image", replaceall(eventToAdd.image, '"', ''))
                .replace("$start", eventToAdd.start)
                .replace("$genres", eventToAdd.genres)

                .replace("$entity_object_id", eventToAdd.organizers[i]._id)
                .replace("$entity_name", replaceall(eventToAdd.organizers[i].name, '"', ''))
                .replace("$entity_image", replaceall(eventToAdd.organizers[i].image, '"', ''))
                .replace("$type", eventToAdd.organizers[i].type)
            )
        }

        for (let i = 0; i < eventToAdd.artists.length; i++) {
            await neo4jClient.run(`MERGE (n:EventNode {object_id: "$object_id", name: "$name", image: "$image", date_start: "$start", genres: "$genres"})
            MERGE(m: EntityNode { object_id: "$entity_object_id", name: "$entity_name", image: "$entity_image", type: "$type" })
            create(m) -[:PLAYS_IN] -> (n)`
                .replace("$object_id", eventToAdd._id)
                .replace("$name", replaceall(eventToAdd.name, '"', ''))
                .replace("$image", replaceall(eventToAdd.image, '"', ''))
                .replace("$start", eventToAdd.start)
                .replace("$genres", eventToAdd.genres)

                .replace("$entity_object_id", eventToAdd.artists[i]._id)
                .replace("$entity_name", replaceall(eventToAdd.artists[i].name, '"', ''))
                .replace("$entity_image", replaceall(eventToAdd.artists[i].image, '"', ''))
                .replace("$type", eventToAdd.artists[i].type)
            )
        }

        if (eventToAdd.club != {})
            await neo4jClient.run(`MERGE (n:EventNode {object_id: "$object_id", name: "$name", image: "$image", date_start: "$start", genres: "$genres"})
            MERGE(m: EntityNode { object_id: "$entity_object_id", name: "$entity_name", image: "$entity_image", type: "$type" })
            create(m) -[:HOSTS] -> (n)`
                .replace("$object_id", eventToAdd._id)
                .replace("$name", replaceall(eventToAdd.name, '"', ''))
                .replace("$image", replaceall(eventToAdd.image, '"', ''))
                .replace("$start", eventToAdd.start)
                .replace("$genres", eventToAdd.genres)

                .replace("$entity_object_id", eventToAdd.club._id)
                .replace("$entity_name", replaceall(eventToAdd.club.name, '"', ''))
                .replace("$entity_image", replaceall(eventToAdd.club.image, '"', ''))
                .replace("$type", "club")
            )
    }
}

module.exports = {
    Event
}