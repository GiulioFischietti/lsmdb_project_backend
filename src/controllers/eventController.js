const { Event } = require('../models/event');
const { Entity } = require('../models/entity');
const { AnalyticsEvent } = require('../models/analyticsEvent');
const { User } = require('../models/user');

const eventByFacebook = async (req, res) => {
    try {
        var event = await Event.eventByFacebook(req)
        // console.log(event)
        // console.log(req.query.facebook)
        res.status(200).send({ "success": true, "data": event })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error, "data": null })
    }
}

const amountEventsScraped = async (req, res) => {
    try {
        const { events_count, addedToday } = await Event.amountEventsScraped()
        res.json({ success: true, "data": { "category": "Events", "amount": events_count, "addedToday": addedToday } })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

const recentData = async (req, res) => {
    var addedRecently = await Event.recentData();
    res.json({ success: true, "data": addedRecently })
}

const searchEvents = async (req, res) => {
    try {
        var parameters = {}
        if (req.body.start != null) parameters.start = { $gte: (new Date(req.body.start)) }
        if (req.body.genres != null && req.body.genres != []) parameters.genres = req.body.genres


        var nearAggreagation = {
            $geoNear: {
                near: { type: "Point", coordinates: [req.body.lon, req.body.lat] },
                distanceField: "dist.calculated",
                maxDistance: req.body.maxDistance,
                query: parameters,
            }
        }

        const searched_events = await Event.searchEvents(nearAggreagation, req.body.userId, req.body.skip)
        res.status(200).send({ "success": true, "data": searched_events })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}


const likeEvent = async (req, res) => {
    try {
        Event.likeEvent(req.body.eventId, req.body.userId);
        User.increaseLikesNumber(req.body.userId)
        res.status(200).send({ "success": true, "data": null })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}
const dislikeEvent = async (req, res) => {
    try {
        User.decreaseLikesNumber(req.body.userId)
        Event.dislikeEvent(req.body.eventId, req.body.userId);
        res.status(200).send({ "success": true, "data": null })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

const eventById = async (req, res) => {
    try {
        const event = await Event.eventById(req)
        res.status(200).send({ "success": true, "data": event })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

const eventsByEntity = async (req, res) => {
    try {
        const events = await Event.eventsByEntity(req.query.entityId, req.query.skip)
        res.status(200).send({ "success": true, "data": events })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

const uploadEvent = async (req, res) => {

    var {_id, ...eventJson} = req.body.data
    var eventToAdd = new Event(eventJson)
    // console.log(eventToAdd)
    const event = await Event.findEventByNameAndStart(eventToAdd)

    if (event == null) {
        try {
            const insertedId = await AnalyticsEvent.uploadAnalyticsEventOnMongoDB(eventToAdd)
            eventToAdd._id = insertedId

            if (eventToAdd.start > new Date()) {
                const addedEvent = new Event(await Event.uploadEventOnMongoDB(eventToAdd))
                Entity.loadUpcomingEvent(addedEvent)
            }
            res.status(200).send({ "success": true, "data": null })
        } catch (error) {
            console.log(error)
            res.status(200).send({ "success": false, "data": "Event not added" })
        }
    } else {
        res.status(200).send({ "success": true, "data": "Event already present" })
    }
}

const updateEvent = async (req, res) => {
    var {_id, ...event} = req.body
    try {
        // console.log(event)
        AnalyticsEvent.updateAnalyticsEventOnMongoDB(_id, event)
        Event.updateEventOnMongoDB(_id, event)
        Entity.updateUpcomingEvent(_id, event)
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(200).send({ "success": false, "data": "Event not added" })
    }

}


const uploadExistingEventOnNeo4j = async (req, res) => {
    try {
        const response = await Event.uploadEventOnNeo4j(req.body.event)
        // console.log(req.body)
        res.status(200).send({ "success": true, "data": response })
    } catch (error) {
        console.log(error)
        console.log(req.body.event)
        res.status(200).send({ "success": false, "data": "Event not added" })
    }
}

const allEvents = async (req, res) => {
    const events = await AnalyticsEvent.getallevents();
    res.status(200).send({ "success": true, "data": events })
}


module.exports = {
    eventByFacebook,
    amountEventsScraped,
    recentData,
    searchEvents,
    eventById,

    uploadEvent,
    updateEvent,

    likeEvent,
    dislikeEvent,
    eventsByEntity,
    allEvents,
    uploadExistingEventOnNeo4j,
    
}
