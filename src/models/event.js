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
        this.image = data.image;
        this.organizers = data.organizers.map((item) => new EntityMinimal(item));
        this.artists = data.artists.map((item) => new EntityMinimal(item));
        this.club = data.club != null ? new EntityMinimal(data.club) : {};
        this.address = data.address;
        this.location = data.location;
        this.createdAt = new Date()
    }

    // static updateUpcomingEvents = async () => {
    // da modificare semplicemnete con una rimozione degli eventi vecchi: questp script va bene come prima aggiunta per inizializzare ilcampo 
    // var data = await this.eventCollection.aggregate([
    //     { $match: { start: { $gte: new Date() } } },
    //     { $project: { _id: "$_id", name: "$name", image: "$image", start: "$start", genres: "$genres", address: "$address", organizers: "$organizers", artists: "$artists" } },
    //     { $addFields: { entities: { $concatArrays: ["$organizers", "$artists"] } } },
    //     { $unwind: { path: "$entities" } },
    //     { $group: { _id: "$entities", events: { $push: "$$ROOT" } } },
    //     { $sort: { "_id._id": 1 } }
    // ]).toArray()

    // for (let i = 0; i < data.length; i++) {
    //     if (i % 100 == 0) console.log(i * 100 / data.length)
    //     try {
    //         this.entityCollection.updateOne({ _id: ObjectId(data[i]._id._id) }, { $set: { upcomingEvents: data[i].events.map((eventDoc) => { return new EventMinimal(eventDoc) }) } })
    //     } catch (error) {
    //         console.log(data[i])
    //     }
    // }


    // }

    static eventById = async (req) => {
        const response = await this.eventCollection.findOne({
            _id: ObjectId(req.query._id)
        })
        return new Event(response)
    }

    static eventByFacebook = async (req) => {
        const response = await this.eventCollection.findOne({
            facebook: req.query.facebook
        })
        return new Event(response)
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

    static searchEvents = async (parameters) => {
        const response = await this.eventCollection.find(parameters).sort({start: 1}).toArray()
        return response.map((item) => new Event(item))
    }

    static findEventByNameAndStart = async (eventToAdd) => {
        const response = await this.eventCollection.findOne({ name: eventToAdd.name, start: eventToAdd.start })
        return response
    }

    static uploadEventOnMongoDB = async (eventToAdd) => {
        await this.eventCollection.insertOne(eventToAdd)
        const addedEvent = await this.eventCollection.findOne({ facebook: eventToAdd.facebook })
        // console.log(addedEvent)
        return addedEvent
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