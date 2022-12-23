const { ObjectId } = require('mongodb');
const { mongoClient } = require('../config/mongoDB');
const { MongoCollection } = require('../config/mongoCollection');

class UninterestingEvent {
    static mongoCollection = new MongoCollection({ collection: "uninterestingEvents" })

    constructor(data) {
        if (data == null) return null
        this.facebook = data.facebook
        this.reason = data.reason
    }

    static addUninterestingEvent = async (data) => {
        this.mongoCollection.insertOne(new UninterestingEvent(data))
    }

    static checkExists = async (facebook) => {
        const response = await this.mongoCollection.findOne({ "facebook": facebook })
        return response
    }

    static getExistingEvents = async (facebookLinks) => {
        const existingEvents = await this.mongoCollection.find({ "facebook": { $in: facebookLinks } }).toArray()
        return existingEvents.map((item) => item.facebook)
    }
}

module.exports = {
    UninterestingEvent
}