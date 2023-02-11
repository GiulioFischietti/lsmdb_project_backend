const { EntityMinimal } = require("./entityMinimal");
const { MongoCollection } = require("../config/mongoCollection");
const { neo4jClient } = require("../config/neo4jDB")
const { ObjectId } = require("mongodb");
const { EventMinimal } = require("./EventMinimal");
const { EventToScrape } = require("./eventsToScrape");

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

        this._id = data._id != null ? ObjectId(data._id) : null;
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
        this.likedBy = data.likedBy
        this.createdAt = new Date()

        if (this.likedByUser == null) delete this.likedByUser
        if (this.likedBy == null) delete this.likedBy
        if (this.dist == null) delete this.dist
        if (this._id == null) delete this._id
    }

    static updateEmbeddedEntities = async (_id, entity) => {
        await this.eventCollection.updateMany({ "club._id": ObjectId(_id) }, { $set: { "club.name": entity.name, "club.image": entity.image } })
        await this.eventCollection.updateMany({ "organizers._id": ObjectId(_id) }, { $set: { "organizers.$.name": entity.name, "organizers.$.image": entity.image } })
        await this.eventCollection.updateMany({ "artists._id": ObjectId(_id) }, { $set: { "artists.name.$": entity.name, "artists.image.$": entity.image, } })

        await this.analyticsEventsCollection.updateMany({ "club._id": ObjectId(_id) }, { $set: { "club.name": entity.name, "club.image": entity.image } })
        await this.analyticsEventsCollection.updateMany({ "organizers._id": ObjectId(_id) }, { $set: { "organizers.$.name": entity.name, "organizers.$.image": entity.image } })
        await this.analyticsEventsCollection.updateMany({ "artists._id": ObjectId(_id) }, { $set: { "artists.name.$": entity.name, "artists.image.$": entity.image, } })
        return true
    }

    static eventById = async (req) => {
        const response = await this.eventCollection.aggregate([
            {
                $match: { _id: ObjectId(req.query._id) }
            },
            { $addFields: { likedByUser: { $in: [ObjectId(req.query.userId), "$likedBy"] } } }]).toArray()
        return new Event(response[0])
    }

    static getEventById = async (id) => {
        const response = await this.eventCollection.findOne(
            {
                _id: ObjectId(id)
            },
        )
        return new Event(response)
    }

    static managerEventById = async (eventId) => {
        const response = await this.analyticsEventsCollection.findOne({ _id: ObjectId(eventId) });
        return new Event(response);
    }

    static eventByFacebook = async (req) => {
        const response = await this.eventCollection.findOne({
            facebook: req.query.facebook
        })
        return new Event(response)
    }

    static eventsByEntity = async (entityId, skip) => {
        skip = parseFloat(skip)
        const response = (await this.analyticsEventsCollection.find({
            "club._id": ObjectId(entityId),
        }).sort({ start: -1 }).skip(skip).limit(10).toArray()).map((item) => { return new Event(item) })
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
        const response = await this.analyticsEventsCollection.find({ "likedBy.1": { $exists: true } }).toArray()
        return response.map((item) => new Event(item))
    }

    static likeEventOnMongoDB = async (eventId, userId) => {
        return await this.eventCollection.updateOne({ _id: ObjectId(eventId) }, { $addToSet: { likedBy: ObjectId(userId) } })
    }


    static dislikeEventOnMongoDB = async (eventId, userId) => {
        this.eventCollection.updateOne({ _id: ObjectId(eventId) }, { $pull: { likedBy: ObjectId(userId) } })
    }


    static likeEventOnNeo4j = async (eventId, userId) => {
        return await neo4jClient.run(`
        MATCH (u:User {_id: "$userId"})
        MATCH (e:Event {_id: "$eventId"})
        CREATE (u)-[:LIKES]->(e)
        `)
    }

    static dislikeEventOnNeo4j = async (eventId, userId) => {
        return await neo4jClient.run(`
        MATCH (u:User {_id: "$userId"})-[l:LIKES]->(e:Event {_id: "$eventId"})
        DELETE l
        `)
    }


    static removePastLikesNeo4j = async () => {
        await neo4jClient.run(`match (e:Event)<-[l:LIKES]-(u:User) where e.date_start < datetime() delete l`)
    }


    static deleteOldNeo4jEvents = async () => {
        var now = new Date()
        now.setFullYear(new Date().getFullYear - 1)
        await neo4jClient.run(`match (e:Event) where e.date_start < datetime(` + now.toLocaleString() + `) delete e`);
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
        // console.log(insertedEvent)
        return insertedEvent
    }

    static updateEventOnMongoDB = async (id, event) => {
        return await this.eventCollection.updateOne({ _id: ObjectId(id) }, { $set: new Event(event) })
    }

    static deleteEventOnMongoDB = async (id) => {
        this.eventCollection.deleteOne({ _id: ObjectId(id) })
    }

    static deleteAnalyticsEventOnMongoDB = async (id) => {
        this.analyticsEventsCollection.deleteOne({ _id: ObjectId(id) })
    }

    static deleteAnalyticsEventOnNeo4j = async (id) => {
        neo4jClient.run(`match(n: Event) where ID(n)=$id  detach delete n`
            .replace("$id", id)
        )
    }

    static updateEventOnNeo4j = async (id, event) => {
        var parsedArray = event.genres.map((item) => { return '"' + item + '"' })
        return await neo4jClient.run(`
            match(e: Event {_id: "$id"})
            set e.name = "$name",
            e.genres = [$genres],
            e.image = "$image",
            e.date_start = datetime("$start"),
            e.address = "$address"
            `
            .replace("$id", id)
            .replace("$name", event.name)
            .replace("$genres", parsedArray)
            .replace("$image", event.image)
            .replace("$start", event.start)
            .replace("$address", event.address)
        )
    }

    static getSuggestedEvents = async (userId, skip) => {
        const response = await neo4jClient.run(
            `MATCH (me:User{_id: "$userId"})-[f:FOLLOWS]->(u:User)-[l:LIKES]->(e:Event)
            WITH count(l) as likesCount, me as me, e as e
            ORDER BY likesCount desc
            WHERE NOT EXISTS((me)-[:LIKES]->(e))
            RETURN e
            SKIP $skip LIMIT 10`
                .replace("$skip", skip)
                .replace("$userId", userId)
        )
        return response.records.map((item) => { return new EventMinimal({ ...item.toObject().e.properties, "start": item.toObject().e.properties.date_start }) })
    }

    static uploadEventOnNeo4j = async (eventToAdd) => {
        var response;
        var parsedArray = eventToAdd.genres.map((item) => { return '"' + item + '"' })
        if (eventToAdd.club != {} && eventToAdd.club != null) {
            response = await neo4jClient.run(`MERGE (n:Event {_id: "$object_id", name: "$name", address: "$address", image: "$image", date_start: datetime("$start"), genres: [$genres]})
                MERGE(m: Entity { _id: "$entity_object_id", name: "$entity_name", image: "$entity_image", type: "$type" })
                create(m) -[:HOSTS] -> (n) return ID(n)`
                .replace("$object_id", eventToAdd._id)
                .replace("$name", replaceall(eventToAdd.name, '"', ''))
                .replace("$image", replaceall(eventToAdd.image, '"', ''))
                .replace("$start", eventToAdd.start.toISOString())
                .replace("$genres", parsedArray)
                .replace("$address", replaceall(eventToAdd.address, '"', ''))

                .replace("$entity_object_id", eventToAdd.club._id)
                .replace("$entity_name", replaceall(eventToAdd.club.name, '"', ''))
                .replace("$entity_image", replaceall(eventToAdd.club.image, '"', ''))
                .replace("$type", "club")
            )
        }

        for (let i = 0; i < eventToAdd.organizers.length; i++) {
            await neo4jClient.run(`MERGE (n:Event {_id: "$object_id", name: "$name", address: "$address", image: "$image", date_start: datetime("$start"), genres: [$genres]})
            MERGE(m: Entity { _id: "$entity_object_id", name: "$entity_name", image: "$entity_image", type: "$type" })
            create(m) -[:ORGANIZES] -> (n)`
                .replace("$object_id", eventToAdd._id)
                .replace("$name", replaceall(eventToAdd.name, '"', ''))
                .replace("$image", replaceall(eventToAdd.image, '"', ''))
                .replace("$start", eventToAdd.start.toISOString())
                .replace("$genres", parsedArray)
                .replace("$address", replaceall(eventToAdd.address, '"', ''))

                .replace("$entity_object_id", eventToAdd.organizers[i]._id)
                .replace("$entity_name", replaceall(eventToAdd.organizers[i].name, '"', ''))
                .replace("$entity_image", replaceall(eventToAdd.organizers[i].image, '"', ''))
                .replace("$type", eventToAdd.organizers[i].type)
            )
        }

        for (let i = 0; i < eventToAdd.artists.length; i++) {
            await neo4jClient.run(`MERGE (n:Event {_id: "$object_id", name: "$name", address: "$address", image: "$image", date_start: datetime("$start"), genres: [$genres]})
            MERGE(m: Entity { _id: "$entity_object_id", name: "$entity_name", image: "$entity_image", type: "$type" })
            create(m) -[:PLAYS_IN] -> (n)`
                .replace("$object_id", eventToAdd._id)
                .replace("$name", replaceall(eventToAdd.name, '"', ''))
                .replace("$image", replaceall(eventToAdd.image, '"', ''))
                .replace("$start", eventToAdd.start.toISOString())
                .replace("$genres", parsedArray)
                .replace("$address", replaceall(eventToAdd.address, '"', ''))

                .replace("$entity_object_id", eventToAdd.artists[i]._id)
                .replace("$entity_name", replaceall(eventToAdd.artists[i].name, '"', ''))
                .replace("$entity_image", replaceall(eventToAdd.artists[i].image, '"', ''))
                .replace("$type", eventToAdd.artists[i].type)
            )
        }

        return response.records[0].get("ID(n)").low
    }
}

module.exports = {
    Event
}