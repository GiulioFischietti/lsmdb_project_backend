const { ObjectId } = require('mongodb');
const { Club } = require('../models/club');
const { Entity } = require('../models/entity');
const { buildEntity } = require('../models/entityBuilder');
const { EntityMinimal } = require('../models/entityMinimal');
const { Manager } = require('../models/manager');
const { Review } = require('../models/review');
const { User } = require('../models/user');
const { Event } = require('../models/event');
const { EventMinimal } = require('../models/EventMinimal');

const getAllClubs = async (req, res) => {
    try {
        const response = await Entity.getClubsToScrape();
        res.status(200).send({ "success": true, data: response.map((item) => new Club(item)) })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const all = async (req, res) => {
    try {
        const response = await Entity.all();
        res.status(200).send({ "success": true, data: response.map((item) => new Club(item)) })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const getEntitiesToUpdate = async (req, res) => {
    try {
        const response = await Entity.getEntitiesToUpdate();
        res.status(200).send({ "success": true, data: response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: clubs })
    }
}
const getTopRatedEntities = async (req, res) => {
    try {
        const response = await Entity.topRatedEntities(req.query.skip);
        res.status(200).send({ "success": true, data: response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}
const updateEntityDateTime = async (req, res) => {
    try {
        Entity.updateEntityDateTime(req.body.id);
        res.status(200).send({ "success": true, data: null });
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const followEntity = async (req, res) => {

    try {
        await Entity.followEntityMongoDB(req.body.entityId, req.body.userId);
        User.increaseFollowingNumber(req.body.userId)
        Entity.followEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        console.log(error)
        User.decreaseFollowingNumber(req.body.userId)
        Entity.unfollowEntityMongoDB(req.body.entityId, req.body.userId);
        Entity.unfollowEntityNeo4j(req.body.userId, req.body.entityId)

        res.status(200).send({ "success": false })
    }
}


const unfollowEntity = async (req, res) => {

    try {
        User.decreaseFollowingNumber(req.body.userId)
        await Entity.unfollowEntityMongoDB(req.body.entityId, req.body.userId);
        Entity.unfollowEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        User.increaseFollowingNumber(req.body.userId)
        Entity.followEntityMongoDB(req.body.entityId, req.body.userId);
        Entity.followEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": false })
    }
}


const updateEntity = async (req, res) => {
    let { _id, ...entity } = req.body.entity
    var beforeState = await Entity.getEntityById(_id)

    try {

        // own entity must be seen as updated, and eventually all others documents embedded and in neo4j 
        const response = await Entity.updateEntity(ObjectId(_id), entity);
        Event.updateEmbeddedEntities(_id, new EntityMinimal(entity))
        Review.updateEmbeddedEntity(_id, new EntityMinimal(entity))
        Entity.updateEntityOnNeo4j(_id, entity)
        res.status(200).send({ "success": true, data: response });
    } catch (error) {
        console.log(error)
        Entity.updateEntity(ObjectId(_id), beforeState);
        Event.updateEmbeddedEntities(_id, new EntityMinimal(beforeState))
        Review.updateEmbeddedEntity(_id, new EntityMinimal(beforeState))
        Entity.updateEntityOnNeo4j(_id, beforeState)
        res.status(500).send({ "success": false, data: null })
    }
}

const searchEntities = async (req, res) => {
    var skip = 0;
    var limit = 10;
    if (req.body.skip != null) skip = req.body.skip
    if (req.body.limit != null) limit = req.body.limit
    try {
        var parameters = {}

        if (req.body.type != null) {
            parameters.type = req.body.type
        }

        if (req.body.lat != null) {
            parameters =
            {

                "location": {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [req.body.lon, req.body.lat]
                        },
                        $maxDistance: req.body.maxDistance,
                        $minDistance: 0
                    }
                }
            }
        }

        if (req.body.keyword != null) {

            parameters.name = { $regex: req.body.keyword, $options: "i" }
        }

        const searched_events = await Entity.searchEntities(parameters, skip, limit)
        res.status(200).send({ "success": true, "data": searched_events })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

const loadEntity = async (req, res) => {
    try {
        const entity = buildEntity(req.body.entity)
        var _id = await Entity.loadEntity(entity);
        res.status(200).send({ "success": true, "data": _id })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const getSuggestedArtistsForCooperation = async (req, res) => {
    try {
        const response = await Entity.getSuggestedArtistsForCooperation(req.body.entityId, req.body.skip)
        res.status(200).send({ "success": true, "data": response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const getSuggestedEntities = async (req, res) => {
    try {
        const response = await Entity.getSuggestedEntities(req.body.userId, req.body.skip)
        res.status(200).send({ "success": true, "data": response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const getFollowers = async (req, res) => {
    try {
        const response = await Entity.getFollowers(req.body.entityId, req.body.skip)
        res.status(200).send({ "success": true, "data": response })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}


const entityById = async (req, res) => {
    try {
        const response = await Entity.entityById(req)
        const entity = buildEntity(response)
        res.status(200).send({ "success": true, "data": entity })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const entitiesWithLocation = async (req, res) => {
    try {
        const response = await Entity.entitiesWithLocation(req)
        res.status(200).send({ "success": true, "data": response })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const entityByName = async (req, res) => {
    try {
        const response = await Entity.entityByName(req)
        console.log(response)
        const entity = buildEntity(response)
        res.status(200).send({ "success": true, "data": entity })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}
const entityByFacebook = async (req, res) => {
    try {
        const response = await Entity.entityByFacebook(req.query.facebook)
        console.log(response)
        const entity = buildEntity(response)
        res.status(200).send({ "success": true, "data": entity })

    } catch (error) {
        console.log(error)

    }
}

const entityRateByYear = async (req, res) => {
    try {
        var entityId = req.query.entityId
        const response = await Review.entityRateByYear(entityId)
        res.status(200).send({ "success": true, "data": response })
    } catch (error) {
        res.status(500).send({ "success": false, "data": null })
    }
}

const mostUsedWordsForClub = async (req, res) => {
    try {
        var entityId = req.query.entityId
        // console.log(entityId)
        const response = await Review.mostUsedWordsForClub(entityId)
        res.status(200).send({ "success": true, "data": response })
    } catch (error) {
        res.status(500).send({ "success": false, "data": null })
    }
}


module.exports = {
    getAllClubs,
    updateEntityDateTime,
    loadEntity,
    entityById,
    entityByFacebook,
    entityByName,
    entitiesWithLocation,
    updateEntity,
    getEntitiesToUpdate,
    searchEntities,
    followEntity,
    unfollowEntity,
    getTopRatedEntities,
    entityRateByYear,
    mostUsedWordsForClub,
    getSuggestedArtistsForCooperation,
    getSuggestedEntities,
    getFollowers,
    all
}