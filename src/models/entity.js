const { ObjectId, Db } = require('mongodb');
const { MongoCollection } = require('../config/mongoCollection');
const { EventMinimal } = require('./EventMinimal');
// const buildEntity = require('./entityBuilder')
const { Review } = require('./review');

class Entity {

    static mongoCollection = new MongoCollection({ collection: "entities" })
    static eventsCollection = new MongoCollection({ collection: "events" })

    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.name = data.name;
        this.description = data.description;
        this.image = data.image;
        this.socialMedias = data.socialMedias != null ? data.socialMedias : [];
        this.type = data.type;
        this.createdAt = new Date();
        this.facebookLinks = data.facebookLinks;
        this.email = data.email;
        this.phones = data.phones;
        this.avgRate = data.avgRate;
        this.loginNeeded = data.loginNeeded;
        this.facebookDescription = data.facebookDescription;
        this.websites = data.websites;
        this.reviews = data.reviews != null ? data.reviews.map((item) => new Review(item)) : []
        this.upcomingEvents = data.upcomingEvents != null ? data.upcomingEvents.map((item) => new EventMinimal(item)) : []
        this.reviewIds = data.reviewIds != null ? data.reviewIds : []
    }

    static getClubsToScrape = async () => {
        return await this.mongoCollection.find({ type: "club", "location": { $exists: true }, "address": { $exists: true, $nin: ["", null] } }).sort({ lastUpdatedEvent: 1 }).toArray()
    }

    static getEntitiesToUpdate = async () => {
        return await this.mongoCollection.find({ type: "club", address: { $in: [null, ""] }, "location.coordinates": { $exists: false } }).toArray()
    }

    static searchEntities = async (parameters) => {
        const response = await this.mongoCollection.find(parameters).limit(8).toArray()
        return response.map((item) => new Entity(item))
    }

    static loadUpcomingEvent = async (addedEvent) => {
        // console.log(addedEvent)
        var entitiesToUpdate = addedEvent.organizers.concat(addedEvent.artists)
        for (let i = 0; i < entitiesToUpdate.length; i++) {
            this.mongoCollection.updateOne({ _id: ObjectId(entitiesToUpdate[i]._id) }, { $addToSet: { upcomingEvents: new EventMinimal(addedEvent) } })
        }
    }

    static updateUpcomingEvents = async () => {
        console.log("Updating upcoming events...")
        this.mongoCollection.updateMany({ "upcomingEvents.start": { $lte: new Date() } }, { $pull: { upcomingEvents: { start: { $lte: new Date() } } } })
        console.log("Done")
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

    static loadEntity = async (entityToAdd) => {
        // console.log("LOADING ENTITY")
        // console.log(entityToAdd)
        const entity = await this.mongoCollection.findOne({ name: entityToAdd.name, description: entityToAdd.description })
        if (entity == null) {
            const response = await this.mongoCollection.insertOne(entityToAdd)
            return response.insertedId;
        }
        else {
            this.mongoCollection.updateOne({_id: ObjectId(entity._id)}, {$addToSet: {facebookLinks: {$each: entityToAdd.facebookLinks}}})
            console.log(entityToAdd.facebookLinks)
            return entity._id
        }
    }

    static updateEntityDateTime = async (id) => {
        this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $set: { lastUpdatedEvent: new Date() } });
    }

    static updateEntity = async (id, entity) => {
        // delete entity._id
        // delete entity.image

        // const entityRetrieved = await this.mongoCollection.findOne({ _id: ObjectId(id) })
        // if (entityRetrieved.phones != null) {
        //     if (entityRetrieved.phones.length > 0) {
        //         delete entity.phones
        //     }
        // }


        // if (entityRetrieved.websites != null) {
        //     if (entityRetrieved.websites.length > 0) {
        //         delete entity.websites
        //     }
        // }

        this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $set: entity });
        // this.mongoCollection.updateOne({ _id: ObjectId(id) }, { $unset: { ig: 1 } });
    }

}

module.exports = {
    Entity
}