const { ObjectId } = require('mongodb');
const { MongoCollection } = require('../config/mongoCollection');
const { Review } = require('./review');

class Entity {

    static mongoCollection = new MongoCollection({ collection: "entities" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.name = data.name;
        this.description = data.description;
        this.image = data.image;
        this.type = data.type;
        this.createdAt = new Date();
        this.facebook = data.facebook;
        this.email = data.email;
        this.phones = data.phones;
        this.websites = data.websites;
        this.reviews = data.reviews != null ? data.reviews.map((item) => new Review(item)) : []
        this.reviewIds = data.reviewIds != null ? data.reviewIds : []
    }

    static getClubsToScrape = async () => {
        return await this.mongoCollection.find({type: "club", "location": {$exists: true}, "address": {$exists: true, $nin: ["", null]}}).sort({lastUpdatedEvent: 1}).toArray()
    }

    static entityById = async (req) => {
        const entity = await this.mongoCollection.findOne({
            _id: ObjectId(req.query._id)
        })
        return entity;
    }

    static entitiesByType = async (type) => {
        const entity = await this.mongoCollection.find({
            type: type
        }).sort({lastUpdatedEvent: 1}).toArray()
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
            facebook: facebookLink
        })
        return entity
    }

    static loadEntity = async (entityToAdd) => {
        this.mongoCollection.insertOne(entityToAdd)
    }

    static updateEntityDateTime = async (id) => {
        this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $set: { lastUpdatedEvent: new Date() } });
    }
}

module.exports = {
    Entity
}