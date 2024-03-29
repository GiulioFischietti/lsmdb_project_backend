const { Event } = require('../models/event');
const { Entity } = require('../models/entity');
const { AnalyticsEvent } = require('../models/analyticsEvent');
const { User } = require('../models/user');
const { EventToScrape } = require('../models/eventsToScrape');

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


const likeEventsNeo4j = async (req, res) => {
    try {
        await Event.likeEventOnNeo4j(req.body.eventId, req.body.userIds);
        res.status(200).send({ "success": true, "data": null })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}



const likeEvent = async (req, res) => {
    
    const {eventId, ...beforeStateEvent} = await Event.getEventById(req.body.eventId)
    const {userId, ...beforeStateUser} = await User.getUserById(req.body.userId)
    try {
        // console.log(req.body)
        await Event.likeEventOnMongoDB(req.body.eventId, req.body.userId);
        await User.increaseLikesNumber(req.body.userId)
        Event.likeEventOnNeo4j(req.body.eventId, req.body.userId);
        
        res.status(200).send({ "success": true, "data": null })

    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        console.log(error)
        Event.updateEventOnMongoDB(eventId, beforeStateEvent);
        User.updateUser(userId, beforeStateUser)
        Event.dislikeEventOnNeo4j(req.body.eventId, req.body.userId);
        
        res.status(200).send({ "success": false })
    }
}



const dislikeEvent = async (req, res) => {
    const {eventId, ...beforeStateEvent} = await Event.getEventById(req.body.eventId)
    const {userId, ...beforeStateUser} = await User.getUserById(req.body.userId)

    try {
        await Event.dislikeEventOnMongoDB(req.body.eventId, req.body.userId);
        await User.decreaseLikesNumber(req.body.userId)
        Event.dislikeEventOnNeo4j(req.body.eventId, req.body.userId);
        res.status(200).send({ "success": true, "data": null })

    } catch (error) {
        console.log("EXCEPTION OCCURRED, ROLLING BACK")
        console.log(error)
        Event.updateEventOnMongoDB(eventId, beforeStateEvent);
        User.updateUser(userId, beforeStateUser)
        Event.likeEventOnNeo4j(req.body.eventId, req.body.userId);
        
        res.status(200).send({ "success": false })
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


const managerEventById = async (req, res) => {
    try {
        const event = await Event.managerEventById(req.query.eventId)
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

const getSuggestedEvents = async (req, res) => {
    try {
        const events = await Event.getSuggestedEvents(req.query.userId, req.query.skip)
        res.status(200).send({ "success": true, "data": events })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
}

const uploadEvent = async (req, res) => {

    var { _id, ...eventJson } = req.body.data
    eventJson.likedBy = []
    var eventToAdd = new Event(eventJson)

    const event = await Event.findEventByNameAndStart(eventToAdd)

    var eventIdMongoDB
    var eventIdNeo4j

    if (event == null) {

        try {

            eventIdMongoDB = await AnalyticsEvent.uploadAnalyticsEventOnMongoDB(eventToAdd)
            eventToAdd._id = eventIdMongoDB

            if (eventToAdd.start > new Date()) {
                const addedEvent = new Event(await Event.uploadEventOnMongoDB(eventToAdd))
                Entity.loadUpcomingEvent(addedEvent)
            }

            eventIdNeo4j = await Event.uploadEventOnNeo4j(eventToAdd)

            EventToScrape.discardEvent(eventToAdd['facebook'])
            res.status(200).send({ "success": true, "data": null })

        } catch (error) {
            console.log("ERROR, ROLLBACK")
            console.log(error)

            if (eventIdMongoDB != null)
                AnalyticsEvent.deleteAnalyticsEventOnMongoDB(eventIdMongoDB)
            if (eventIdMongoDB != null)
                Event.deleteEventOnMongoDB(eventIdMongoDB)
            if (eventIdMongoDB != null)
                Entity.deleteUpcomingEvent(eventIdMongoDB, eventToAdd)
            if (eventIdNeo4j != null)
                Event.deleteAnalyticsEventOnMongoDB(eventIdNeo4j)

            res.status(200).send({ "success": false, "data": "Event not added" })
        }
    } else {
        res.status(200).send({ "success": true, "data": "Event already present" })
    }
}

const updateEvent = async (req, res) => {
    var { _id, ...event } = req.body
    
    var { _id, ...beforeState } = await Event.getEventById(_id)
    if (beforeState != null) {
        try {
            await AnalyticsEvent.updateAnalyticsEventOnMongoDB(_id, event)
            Event.updateEventOnMongoDB(_id, event)
            Entity.updateUpcomingEvent(_id, event)
            Event.updateEventOnNeo4j(_id, event)
            res.status(200).send({ "success": true, "data": event })
        } catch (error) {
            AnalyticsEvent.updateAnalyticsEventOnMongoDB(_id, beforeState)
            Event.updateEventOnMongoDB(_id, beforeState)
            Entity.updateUpcomingEvent(_id, beforeState)
            Event.updateEventOnNeo4j(_id, beforeState)
            res.status(200).send({ "success": false, "data": "Event not updated" })
        }
    }
    else {
        res.status(200).send({ "success": false, "data": "Event not found" })
    }
}

const deleteEvent = async (req, res) => {
    var { _id, ...event } = req.body
    try {
        // console.log(event)
        AnalyticsEvent.deleteAnalyticsEventOnMongoDB(_id)
        Event.deleteEventOnMongoDB(_id)
        Entity.deleteUpcomingEvent(_id, event)
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(200).send({ "success": false, "data": "Event not added" })
    }

}

const uploadExistingEventOnNeo4j = async (req, res) => {
    try {
        for (let i = 0; i < req.body.events.length; i++) {
            const response = await Event.uploadEventOnNeo4j(req.body.events[i])
            console.log(req.body.events[i])
            break
        }

        // console.log(req.body)
        res.status(200).send({ "success": true, "data": null })
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

const variegatedClubs = async (req, res) => {
    const data = await AnalyticsEvent.variegatedClubs()
    res.status(200).send({ "success": true, "data": data })
}

module.exports = {
    eventByFacebook,
    amountEventsScraped,
    recentData,
    searchEvents,

    eventById,
    managerEventById,


    uploadEvent,
    updateEvent,
    deleteEvent,

    likeEvent,
    dislikeEvent,
    eventsByEntity,
    allEvents,
    uploadExistingEventOnNeo4j,

    variegatedClubs,
    likeEventsNeo4j,

    getSuggestedEvents
}
