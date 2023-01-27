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
    try {
        User.increaseFollowingNumber(req.body.userId)
        Entity.followEntity(req.body.entityId, req.body.userId);
        res.status(200).send({ "success": true, data: null });
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const unfollowEntity = async (req, res) => {
    try {
        User.decreaseFollowingNumber(req.body.userId)
        Entity.unfollowEntity(req.body.entityId, req.body.userId);
        res.status(200).send({ "success": true, data: null });
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}


const updateEntity = async (req, res) => {
    try {
        let {_id, ...entity} = req.body.entity
        
        Entity.updateEntity(ObjectId(_id), entity);
        Manager.updateManagedEntity(ObjectId(req.body.userId), entity);
        Event.updateEmbeddedEntities(_id, new EntityMinimal(entity))
        Review.updateEmbeddedEntity(_id, new EntityMinimal(entity))
        res.status(200).send({ "success": true, data: null });
        
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

const searchEntities = async (req, res) => {
    try {
        var parameters = {
            "type": req.body.type,
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

        const searched_events = await Entity.searchEntities(parameters, req.body.skip)
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
    getTopRatedEntities
}