const { MongoCollection } = require('../config/mongoCollection');
const { ObjectId } = require("mongodb");
const { RegisteredUser } = require('./registeredUser');
const { driver, neo4jclient } = require('../config/neo4jDB');
const { UserMinimal } = require('./UserMinimal');
const { EventMinimal } = require('./EventMinimal');

class User extends RegisteredUser {
    static mongoQueryBuilder = new MongoCollection({ collection: "users" })

    constructor(data) {
        super(data)
        if (data == null) return null
        this.role = "user"
        this.reviews = data.reviews != null ? data.reviews : [];
        this.followedBy = data.followedBy != null ? data.followedBy : [];
        this.nFollowers = data.nFollowers != null ? data.nFollowers : 0
        this.nLikes = data.nLikes != null ? data.nLikes : 0
        this.nFollowings = data.nFollowings != null ? data.nFollowings : 0
    }

    static createUserMongoDB = async (userData) => {
        userData.createdAt = new Date()
        userData.updatedAt = new Date()
        userData = new User(userData)
        const response = await this.mongoQueryBuilder.insertOne(userData)
        userData._id = response.insertedId

        return userData
    }


    static getAllUsers = async (skip, limit) => {
        return await this.mongoQueryBuilder.find({ followedBy: { $exists: true } }).skip(skip).limit(limit).toArray()
    }

    static increaseFollowerNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowers: 1 } })
    }

    static decreaseFollowerNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowers: -1 } })
    }

    static increaseFollowingNumber = async (userId) => {
        return this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowings: 1 } })
    }

    static decreaseFollowingNumber = async (userId) => {
        return this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowings: -1 } })
    }

    static increaseLikesNumber = async (userId) => {
        return await this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nLikes: 1 } })
    }

    static decreaseLikesNumber = async (userId) => {
        this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nLikes: -1 } })
    }


    static getSuggestedFriendsOfUser = async (userId, myUserId, skip) => {
        const response = await driver.session().run(`
        match (u1:User {_id: "$myUserId"})<-[:FOLLOWS]->(u2:User {_id: "$userId"})-[:FOLLOWS]->(u3:User)<-[f:FOLLOWS]-(u4:User)
        with count(f) as followers, u1, u3
        where not exists ((u1)-[:FOLLOWS]->(u3))
        return u3
        order by followers desc
        skip $skip
        limit 10`
            .replace("$myUserId", myUserId)
            .replace("$userId", userId)
            .replace("$skip", skip)
        )
        return response.records.map((item) => { return new UserMinimal(item.toObject().u3.properties) })

    }

    static getSuggestedFriendsBasedOnLikes = async (userId, skip) => {
        const response = await driver.session().run(
            `MATCH (me:User{_id: "$userId"})-[f:LIKES]->(e:Event)<-[l:LIKES]-(u:User)
            WITH count(l) as commonLikesCount, me,e,f,l,u
            ORDER BY commonLikesCount desc
            WHERE NOT EXISTS((me)-[:FOLLOWS]->(u))
            RETURN u
            skip $skip
            limit 10`
                .replace("$skip", skip)
                .replace("$userId", userId)
        )
        return response.records.map((item) => { return new UserMinimal(item.toObject().u.properties) })
    }


    static followedUsersNeo4j = async (userId, followers) => {
        followers = followers.map((item) => { return '"' + item + '"'; })

        driver.session().run(`unwind [$followers] as loop
        match (n:User {_id: loop}), (m:User {_id: "$userId"})  
        create (n)-[:FOLLOWS]->(m);`
            .replace("$userId", userId)
            .replace("$followers", followers))
    }

    static followedEntitiesNeo4j = async (entityId, followers) => {
        followers = followers.map((item) => { return '"' + item + '"'; })

        driver.session().run(`unwind [$followers] as loop
        match (n:User {_id: loop}), (m:Entity {_id: "$entityId"})  
        create (n)-[:FOLLOWS]->(m);`
            .replace("$entityId", entityId)
            .replace("$followers", followers))
    }

    static getFollowings = async (userId, skip) => {
        const response = await driver.session().run(`match (u1:User {_id: "$userId"})-[:FOLLOWS]->(u2) return u2 skip $skip limit 10`
            .replace("$userId", userId)
            .replace("$skip", skip)
        )

        return response.records.map((item) => { return ({ ... { "type": item.toObject().u2.labels[0].toLowerCase() }, ...item.toObject().u2.properties }) })
        // return response.records.map((item) => { return new UserMinimal(item.toObject().u2.properties) })
    }


    static getFollowers = async (userId, skip) => {
        const response = await driver.session().run(`match (u1:User {_id: "$userId"})<-[:FOLLOWS]-(u2:User) return u2 skip $skip limit 10`
            .replace("$userId", userId)
            .replace("$skip", skip)
        )
        return response.records.map((item) => { return new UserMinimal(item.toObject().u2.properties) })
    }

    static getLikedEvents = async (userId, skip) => {
        const response = await driver.session().run(`match (u1:User {_id: "$userId"})-[:LIKES]-(e:Event) return e order by e.date_start desc skip $skip limit 10`
            .replace("$userId", userId)
            .replace("$skip", skip)
        )

        return response.records.map((item) => { return new EventMinimal({ ...item.toObject().e.properties, ...{ "start": item.toObject().e.properties.date_start } }) })
    }


    static followUserMongoDB = async (myUserId, userId) => {
        return await this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowers: 1 }, $addToSet: { followedBy: ObjectId(myUserId) } })
    }

    static unfollowUserMongoDB = async (myUserId, userId) => {
        return this.mongoQueryBuilder.updateOne({ _id: ObjectId(userId) }, { $inc: { nFollowers: -1 }, $pull: { followedBy: ObjectId(myUserId) } })
    }

    static followUserNeo4j = async (myUserId, userId) => {
        return driver.session().run(`
        MATCH (n:User {_id: "$myUserId"}) 
        MATCH (m: User {_id: "$userId" }) 
        CREATE (n)-[:FOLLOWS]->(m)`
            .replace("$myUserId", myUserId)
            .replace("$userId", userId))
    }

    static unfollowUserNeo4j = async (userId, entityId) => {
        return driver.session().run(`MATCH (n:User {_id: "$userId"})-[r:FOLLOWS] ->(m: User { _id: "$entityId" }) delete r`
            .replace("$userId", userId)
            .replace("$entityId", entityId))
    }



    static addReviewedEntity = async (userId, entityId) => {
        this.mongoQueryBuilder.updateOne({ _id: userId }, { $addToSet: { reviewedEntities: entityId } })

    }

    static removePastLikedEvents = async () => {
        console.log("Removing old liked events...")
        this.mongoQueryBuilder.updateMany({ "likesEvents.start": { $lte: new Date() } }, { $pull: { likesEvents: { start: { $lte: new Date() } } } })
        console.log("Done")
    }


}

module.exports = { User }