const { ObjectId } = require("mongodb");
const { MongoCollection } = require("../config/mongoCollection");
const { RegisteredUser } = require("./registeredUser");

class Manager extends RegisteredUser {
    static mongoCollection = new MongoCollection({ collection: "users" })
    constructor(data) {
        super(data)
        if (data == null) return null
        this.managedEntity = data.managedEntity
        this.role = "manager"
    }

    static createManager = async (managerData) => {
        managerData.createdAt = new Date()
        managerData.updatedAt = new Date()
        const response = await this.mongoCollection.insertOne(managerData)
        return response
    }

    static updateManagedEntity = async (userId, entity) => {
        return await this.mongoCollection.updateOne({ _id: ObjectId(userId) }, {
            $set: {
                "managedEntity.phones": entity.phones,
                "managedEntity.name": entity.name,
                "managedEntity.image": entity.image,
                "managedEntity.description": entity.description,
                "managedEntity.socialMedias": entity.socialMedias,
                "managedEntity.websites": entity.websites,
                // "managedEntity.description": entity.description,
                "managedEntity.email": entity.email
            }
        });
    }
}

module.exports = { Manager }