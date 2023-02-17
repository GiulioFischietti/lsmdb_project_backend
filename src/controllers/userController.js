const { Entity } = require('../models/entity');
const { Event } = require('../models/event');
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
    var userUpdatedNeo4j
    delete params._id;
    try {
        userUpdated = await RegisteredUser.updateUser(req.body._id, params)
        embeddedUserUpdated = await Review.updateEmbeddedUser(req.body._id, params)
        embeddedEntityReviewUpdated = await Entity.updateEmbeddedUserInEntity(req.body._id, params)
        userUpdatedNeo4j = await RegisteredUser.updateUserNeo4j(req.body)

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

const followedEntitiesOnNeo4j = async (req, res) => {
    try {
        await User.followedEntitiesNeo4j(req.body.entityId, req.body.followers)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const followUser = async (req, res) => {

    const { myUserId, ...beforeStateUser } = User.getUserById(req.body.myUserId);
    const { userId, ...beforeStateOtherUser } = User.getUserById(req.body.userId);
    try {
        await User.followUserMongoDB(req.body.myUserId, req.body.userId)
        User.increaseFollowingNumber(req.body.myUserId)
        User.followUserNeo4j(req.body.myUserId, req.body.userId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        User.updateUser(userId, beforeStateOtherUser)
        User.updateUser(myUserId, beforeStateUser)
        User.unfollowUserNeo4j(req.body.myUserId, req.body.userId)
        res.status(200).send({ "success": false })
    }
}

const unfollowUser = async (req, res) => {

    const { myUserId, ...beforeStateUser } = User.getUserById(req.body.myUserId);
    const { userId, ...beforeStateOtherUser } = User.getUserById(req.body.userId);

    try {
        User.decreaseFollowingNumber(req.body.myUserId)
        User.unfollowUserMongoDB(req.body.myUserId, req.body.userId)
        User.unfollowUserNeo4j(req.body.myUserId, req.body.userId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")        
        User.updateUser(userId, beforeStateOtherUser)
        User.updateUser(myUserId, beforeStateUser)
        User.followUserNeo4j(req.body.myUserId, req.body.userId)
        console.log("FOLLOW RELATION ADDED TO NEO4J")
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
const getFollowings = async (req, res) => {
    try {
        const response = await User.getFollowings(req.body.userId, req.body.skip)
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

const getLikedEvents = async (req, res) => {
    try {
        const response = await User.getLikedEvents(req.body.userId, req.body.skip)
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
    getCriticUsers,
    getAllUsers,
    followUserOnNeo4j,
    followUser,
    getFollowings,
    getFollowers,
    getLikedEvents,
    getSuggestedFriendsOfUser,
    getSuggestedFriendsBasedOnLikes,
    unfollowUser,
    deleteUser,

    followedEntitiesOnNeo4j
}