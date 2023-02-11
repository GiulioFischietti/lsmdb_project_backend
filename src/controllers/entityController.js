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
    var myIncSuccess;
    var mongoFollowSuccess;
    var neo4jFollowSuccess;

    try {
        myIncSuccess = await User.increaseFollowingNumber(req.body.userId)
        console.log(req.body)
        mongoFollowSuccess = await Entity.followEntityMongoDB(req.body.entityId, req.body.userId);
        neo4jFollowSuccess = await Entity.followEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true, data: { "myIncSuccess": myIncSuccess, "mongoFollowSuccess": mongoFollowSuccess, "neo4jFollowSuccess": neo4jFollowSuccess } })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        console.log(error)
        if (myIncSuccess != null) {
            await User.decreaseFollowingNumber(req.body.userId)
            console.log("DECREASED NUMBER OF FOLLOWINGS")
        }
        if (mongoFollowSuccess != null) {
            await Entity.unfollowEntityMongoDB(req.body.entityId, req.body.userId);
            console.log("FOLLOW RELATION REMOVED FROM MONGODB")
        }
        if (neo4jFollowSuccess != null) {
            await Entity.unfollowEntityNeo4j(req.body.userId, req.body.entityId)
            console.log("FOLLOW RELATION REMOVED FROM NEO4J")
        }
        res.status(200).send({ "success": false })
    }
}


const unfollowEntity = async (req, res) => {
    var myDecSuccess;
    var mongoUnfollowSuccess;
    var neo4jUnfollowSuccess;

    try {
        myDecSuccess = await User.decreaseFollowingNumber(req.body.userId)
        mongoUnfollowSuccess = await Entity.unfollowEntityMongoDB(req.body.entityId, req.body.userId);
        neo4jUnfollowSuccess = await Entity.unfollowEntityNeo4j(req.body.userId, req.body.entityId)
        res.status(200).send({ "success": true })
    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")

        if (myDecSuccess != null) {
            await User.increaseFollowingNumber(req.body.userId)
            console.log("INCREASED NUMBER OF FOLLOWINGS")
        }
        if (mongoUnfollowSuccess != null) {
            await Entity.followEntityMongoDB(req.body.entityId, req.body.userId);
            console.log("FOLLOW RELATION READDED FROM MONGODB")
        }
        if (neo4jUnfollowSuccess != null) {
            await Entity.followEntityNeo4j(req.body.userId, req.body.entityId)
            console.log("FOLLOW RELATION READDED FROM NEO4J")
        }
        res.status(200).send({ "success": false })
    }
}


const updateEntity = async (req, res) => {
    let { _id, ...entity } = req.body.entity
    var beforeState = await Entity.getEntityById(_id)

    try {
        var updateEntityMongoDBSuccessful
        var updateManagedEntitySuccessful
        var updateEmbeddedEntitiesSuccesful
        var updateEmbeddedEntitySuccessful
        var updateEntityNeo4j

        console.log(1)
        updateEntityMongoDBSuccessful = await Entity.updateEntity(ObjectId(_id), entity);
        console.log(2)
        updateManagedEntitySuccessful = await Manager.updateManagedEntity(ObjectId(req.body.userId), entity);
        console.log(3)
        updateEmbeddedEntitiesSuccesful = await Event.updateEmbeddedEntities(_id, new EntityMinimal(entity))
        console.log(4)
        updateEmbeddedEntitySuccessful = await Review.updateEmbeddedEntity(_id, new EntityMinimal(entity))
        console.log("updating neo4j")
        updateEntityNeo4j = await Entity.updateEntityOnNeo4j(_id, entity)
        console.log("done")
        res.status(200).send({ "success": true, data: null });
    } catch (error) {
        console.log(error)
        if (updateEntityMongoDBSuccessful) {
            await Entity.updateEntity(ObjectId(_id), beforeState);
        }
        if (updateManagedEntitySuccessful) {
            await Entity.updateManagedEntity(ObjectId(req.body.userId), beforeState);
        }
        if (updateEmbeddedEntitiesSuccesful) {
            await Event.updateEmbeddedEntities(_id, new EntityMinimal(beforeState))
        }
        if(updateEmbeddedEntitySuccessful) {
            await Review.updateEmbeddedEntity(_id, new EntityMinimal(beforeState))
        }
        if(updateEntityNeo4j) {
            await Entity.updateEntityOnNeo4j(_id, beforeState)
        }
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
    getSuggestedEntities
}