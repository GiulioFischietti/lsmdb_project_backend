const { User } = require('../models/user');

const userById = async (req, res) => {
    try {
        const user = await User.userById(req)
        res.status(200).send({ "success": true, "data": user })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const updateUser = async (req, res) => {
    const params = { ...req.body };
    delete params._id;

    try {
        User.updateUser(req.body._id, params)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}
const likeEvent = async (req, res) => {

    try {
        console.log(req.body)
        User.likeEvent(req.body.userId, req.body.eventId, req.body.start)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const dislikeEvent = async (req, res) => {

    try {
        User.dislikeEvent(req.body.userId, req.body.eventId, req.body.start)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}



const followEntity = async (req, res) => {

    try {
        User.followEntity(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false })
    }
}

const unFollowEntity = async (req, res) => {

    try {
        User.unFollowEntity(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
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
    dislikeEvent
}