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

class AnalyticsEvent {
    static analyticsEventsCollection = new MongoCollection({ collection: "analyticsEvents" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id != null ? ObjectId(data._id) : null;
        this.name = data.name;
        this.description = data.description;
        this.start = new Date(data.start);
        if (data.end != null)
            this.end = new Date(data.end);
        this.genres = data.genres;
        this.facebook = data.facebook;
        this.image = data.image;
        this.organizers = data.organizers.map((item) => new EntityMinimal(item));
        this.artists = data.artists.map((item) => new EntityMinimal(item));
        this.club = data.club != null ? new EntityMinimal(data.club) : {};
        this.address = data.address;
        this.location = data.location;
        this.createdAt = new Date()

        if(data._id == null) delete this._id
    }

    static uploadAnalyticsEventOnMongoDB = async (eventToAdd) => {
        const eventAdded = await this.analyticsEventsCollection.insertOne(eventToAdd)
        return eventAdded.insertedId
    }

    static updateAnalyticsEventOnMongoDB = async (id, event) => {
        console.log(id)
        const eventAdded = await this.analyticsEventsCollection.updateOne({_id: ObjectId(id)}, {$set: new AnalyticsEvent(event)})
        
    }

    static getallevents = async () => {
        const response = await this.analyticsEventsCollection.aggregate([{$match: { location: { $exists: true }, "location.coordinates": { $ne: [0, 0] } }}, {$sample: {size: 10000}}]).toArray()
        return response
    }
}

module.exports = {
    AnalyticsEvent
}