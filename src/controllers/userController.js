const { Entity } = require('../models/entity');
const { RegisteredUser } = require('../models/registeredUser');
const { Review } = require('../models/review');
const { User } = require('../models/user');

const userById = async (req, res) => {
    try {
        const user = await RegisteredUser.userById(req)
        res.status(200).send({ "success": true, "data": user })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const deleteUser = async (req, res) => {

    var deletedUserMongoDB
    // var deletedUserNeo4j
    var deletedUserData

    const beforeState = await User.getUserById(req.body._id);
    // const beforeStateRelations = await User.getUserRelations(req.body._id);

    try {
        deletedUserMongoDB = User.deleteUserMongoDB(req.body._id)
        // deletedUserNeo4j = User.deleteUserNeo4j(req.body._id)
        deletedUserData = await Review.updateEmbeddedUser(req.body._id, { username: "DeletedUser", image: "DeletedUser.png" })
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        if (deletedUserMongoDB) {
            await User.createUserMongoDB(beforeState)
        }
        if (deletedUserData) {
            await Review.updateEmbeddedUser(req.body._id, beforeState)
        }
        res.status(500).send({ "success": false })
    }


    // res.status(200).send({ "success": true, data: beforeStateRelations })
}

const updateUser = async (req, res) => {
    const params = { ...req.body };
    var beforeState = User.getUserById(req.body._id)

    var userUpdated
    var embeddedUserUpdated
    var embeddedEntityReviewUpdated
    delete params._id;
    // console.log(params)
    try {
        userUpdated = await RegisteredUser.updateUser(req.body._id, params)
        embeddedUserUpdated = await Review.updateEmbeddedUser(req.body._id, params)
        embeddedEntityReviewUpdated = await Entity.updateEmbeddedUserInEntity(req.body._id, params)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        console.log(error)
        if (userUpdated) {
            RegisteredUser.updateUser(req.body._id, beforeState)
        }
        if (embeddedUserUpdated) {
            Review.updateEmbeddedUser(req.body._id, beforeState)
        }
        if (embeddedEntityReviewUpdated) {
            Review.updateEmbeddedUserInEntity(req.body._id, beforeState)
        }
        res.status(500).send({ "success": false })
    }
}

const followUserOnNeo4j = async (req, res) => {
    try {
        await User.followedUsersNeo4j(req.body.userId1, req.body.userIds)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const followUser = async (req, res) => {
    var myIncSuccess;
    var mongoFollowSuccess;
    var neo4jFollowSuccess;

    try {
        myIncSuccess = await User.increaseFollowingNumber(req.body.myUserId)
        mongoFollowSuccess = await User.followUserMongoDB(req.body.myUserId, req.body.userId)
        neo4jFollowSuccess = await User.followUserNeo4j(req.body.myUserId, req.body.userId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")

        if (myIncSuccess != null) {
            await User.decreaseFollowingNumber(req.body.userId)
            console.log("DECREASED NUMBER OF FOLLOWINGS")
        }
        if (mongoFollowSuccess != null) {
            await User.unfollowUserMongoDB(req.body.myUserId, req.body.userId)
            console.log("FOLLOW RELATION REMOVED FROM MONGODB")
        }
        if (neo4jFollowSuccess != null) {
            await User.unfollowUserNeo4j(req.body.myUserId, req.body.userId)
            console.log("FOLLOW RELATION REMOVED FROM NEO4J")
        }
        res.status(200).send({ "success": false })
    }
}

const unfollowUser = async (req, res) => {
    var myDecSuccess;
    var mongoUnfollowSuccess;
    var neo4jUnfollowSuccess;

    try {
        myDecSuccess = await User.decreaseFollowingNumber(req.body.myUserId)
        mongoUnfollowSuccess = await User.unfollowUserMongoDB(req.body.myUserId, req.body.userId)
        neo4jUnfollowSuccess = await User.unfollowUserNeo4j(req.body.myUserId, req.body.userId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        if (myDecSuccess != null) {
            await User.increaseFollowingNumber(req.body.myUserId)
            console.log("INCREASED NUMBER OF FOLLOWINGS")
        }
        if (mongoUnfollowSuccess != null) {
            await User.followUserMongoDB(req.body.myUserId, req.body.userId)
            console.log("FOLLOW RELATION ADDED TO MONGODB")
        }
        if (neo4jUnfollowSuccess != null) {
            await User.followUserNeo4j(req.body.myUserId, req.body.userId)
            console.log("FOLLOW RELATION ADDED TO NEO4J")
        }
        res.status(200).send({ "success": false })
    }
}


const getFollowers = async (req, res) => {
    try {
        const response = await User.getFollowers(req.body.userId, req.body.skip)
        res.status(200).send({ "success": true, data: response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const getSuggestedFriendsOfUser = async (req, res) => {
    try {
        const response = await User.getSuggestedFriendsOfUser(req.body.userId, req.body.myUserId, req.body.skip)
        res.status(200).send({ "success": true, data: response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const getSuggestedFriendsBasedOnLikes = async (req, res) => {
    try {
        const response = await User.getSuggestedFriendsBasedOnLikes(req.body.userId, req.body.skip)
        res.status(200).send({ "success": true, data: response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const likeEvent = async (req, res) => {
    try {
        User.likeEvent(req.body.userId, req.body.eventId, req.body.start)
        User.likeEventNeo4j(req.body.userId, req.body.eventId, req.body.start)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const dislikeEvent = async (req, res) => {

    try {
        User.dislikeEvent(req.body.userId, req.body.eventId, req.body.start)
        User.dislikeEventNeo4j(req.body.userId, req.body.eventId, req.body.start)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const followEntity = async (req, res) => {
    try {
        User.followEntity(req.body.userId, req.body.entityId)
        User.followEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}



const unFollowEntity = async (req, res) => {

    try {
        User.unFollowEntity(req.body.userId, req.body.entityId)
        User.unfollowEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const getCriticUsers = async (req, res) => {
    try {
        fromDate = req.query.fromDate
        const data = await Review.getCriticUsers(fromDate)
        res.status(200).send({ "success": true, "data": data })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const data = await User.getAllUsers(parseInt(req.query.skip), parseInt(req.query.limit))
        res.status(200).send({ "success": true, "data": data })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}


module.exports = {
    userById,
    updateUser,
    followEntity,
    unFollowEntity,
    likeEvent,
    dislikeEvent,
    getCriticUsers,
    getAllUsers,
    followUserOnNeo4j,
    followUser,
    getFollowers,
    getSuggestedFriendsOfUser,
    getSuggestedFriendsBasedOnLikes,
    unfollowUser,
    deleteUser
}