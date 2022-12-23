const { Review } = require("./review");
const { MongoCollection } = require('../config/mongoCollection');
const { ObjectId } = require("mongodb");

class User {
    static mongoQueryBuilder = new MongoCollection({ collection: "users" })
    constructor(data) {
        if (data == null) return null
        this._id = data._id;
        this.name = data.name;
        this.password = data.password;
        this.username = data.username;
        this.reviews = data.reviews != null ? data.reviews.map((item) => new Review(item)) : [];
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    static getUserByUsername = async (req) => {
        const user = await this.mongoQueryBuilder.findOne({ email: req.body.email });
        return new User(user)
    }

    static createUser = async (req, hashedPassword) => {
        const response = await this.mongoQueryBuilder.insertOne({ "name": req.body.name, "email": req.body.email, "password": hashedPassword, "created_at": new Date() })
        return response
    }

    static userById = async (req) => {
        const response = await this.mongoQueryBuilder.findOne({
            _id: ObjectId(req.query._id)
        })
        return new User(response)
    }

    static updateUser = async (params) => {
        const response = await this.mongoQueryBuilder.updateOne({
            _id: ObjectId(req.body._id)
        }, { $set: params }, { upsert: false })
        return response
    }
}

module.exports = { User }