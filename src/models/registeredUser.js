const { ObjectId } = require("mongodb");
const { MongoCollection } = require('../config/mongoCollection');
const { neo4jClient, driver } = require("../config/neo4jDB");

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


    static deleteUserMongoDB = async (id) => {
        const response = await this.mongoQueryBuilder.deleteOne({ _id: ObjectId(id) })
        return response
    }

    static deleteUserNeo4j = async (userData) => {
        return driver.session().run(`MATCH (n:User {_id: "$_id"}) detach delete n`
            .replace("$_id", userData._id)
        )
    }
    static getUserRelations = async (userId) => {
        const response = driver.session().run(`MATCH (n:User {_id: "$_id"})<-[r]->(m) return r,n,m`
            .replace("$_id", userId))

        return response.records.map((item)=>{return item.toObject()})
        
        // for (let i = 0; i < relations.length; i++) {
        //     driver.session().run(`MATCH (n:User {_id: "$_id"}) detach delete n`
        //         .replace("$_id", userData._id)
        //     )
        // }
    }

    static recoverUserRelations = async (userId) => {
       
        for (let i = 0; i < relations.length; i++) {
            driver.session().run(`MATCH (n:User {_id: "$_id"}) detach delete n`
                .replace("$_id", userData._id)
            )
        }
    }


    static createUserNeo4j = async (userData) => {
        return driver.session().run(`CREATE (n:User {_id: "$_id", name: "$name", username: "$username", image: "$image"})`
            .replace("$_id", userData._id)
            .replace("$name", userData.name)
            .replace("$username", userData.username)
            .replace("$image", userData.image)
        )
    }
    
    static updateUserNeo4j = async (userData) => {
        return driver.session().run(`MATCH (n:User {_id: "$_id"}) set n.name = "$name", n.username = "$username", n.image = "$image" `
            .replace("$_id", userData._id)
            .replace("$name", userData.name)
            .replace("$username", userData.username)
            .replace("$image", userData.image)
        )
    }


    static userById = async (req) => {
        const response = await this.mongoQueryBuilder.findOne({
            _id: ObjectId(req.query._id)
        })
        return response
    }

    static updateUser = async (id, params) => {
        const response = await this.mongoQueryBuilder.updateOne({
            _id: ObjectId(id)
        }, { $set: params }, { upsert: false })
        return response
    }


    static getUserByUsername = async (req) => {
        const user = await this.mongoQueryBuilder.findOne({ username: req.body.username });
        return user
    }

    static getUserById = async (id) => {
        const user = await this.mongoQueryBuilder.findOne({ _id: ObjectId(id) });
        return user
    }

}

module.exports = { RegisteredUser }