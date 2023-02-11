const { ObjectId } = require('mongodb');
const { mongoClient } = require('../config/mongoDB');
const { MongoCollection } = require('../config/mongoCollection');
const { Club } = require('./club');

class EventToScrape {
    static mongoCollection = new MongoCollection({ collection: "eventsToScrape" })

    constructor(data) {
        if (data == null) return null
        this.facebook = data.facebook
        this.reason = data.reason != null ? data.reason : ""
        this.discarded = data.discarded
        this.club = new Club(data.club)
    }

    static addEventToScrape = async (data) => {
        this.mongoCollection.insertOne(new EventToScrape(data))
    }

    static discardEvent = async (facebookLink, reason) => {
        this.mongoCollection.updateMany({facebook: facebookLink}, {$set: {discarded: true, "reason": reason}})
    }


    static checkExists = async (facebook) => {
        const response = await this.mongoCollection.findOne({ "facebook": facebook })
        return response
    }

    static getExistingEvents = async (facebookLinks) => {
        const existingEvents = await this.mongoCollection.find({ "facebook": { $in: facebookLinks } }).toArray()
        return existingEvents.map((item) => item.facebook)
    }

    static getEventsToScrape = async (facebookLinks) => {
        return await this.mongoCollection.find({ "discarded": false }).toArray()
    }
}

module.exports = {
    EventToScrape
}