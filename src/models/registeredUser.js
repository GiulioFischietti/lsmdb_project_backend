const { ObjectId } = require("mongodb");
const { MongoCollection } = require('../config/mongoCollection');

class RegisteredUser {
    static mongoQueryBuilder = new MongoCollection({ collection: "users" })
    constructor(data) {
        if (data == null) return null
        
        this._id = ObjectId(data._id);
        this.name = data.name;
        this.password = data.password;
        this.image = data.image;
        this.username = data.username;
    
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }
    
    static existsUsername = async (userName) => {
        const response = await this.mongoQueryBuilder.findOne({ username: userName })
        return response != null
    }

    static createUser = async (userData) => {
        userData.createdAt = new Date()
        userData.updatedAt = new Date()
        const response = await this.mongoQueryBuilder.insertOne(userData)
        return response
    }

    static userById = async (req) => {
        const response = await this.mongoQueryBuilder.findOne({
            _id: ObjectId(req.query._id)
        })
        return response
    }

    static updateUser = async (params) => {
        const response = await this.mongoQueryBuilder.updateOne({
            _id: ObjectId(req.body._id)
        }, { $set: params }, { upsert: false })
        return response
    }

    
    static getUserByUsername = async (req) => {
        const user = await this.mongoQueryBuilder.findOne({ username: req.body.username });
        return user
    }

}

module.exports = { RegisteredUser }