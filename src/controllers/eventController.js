const { Event } = require('../models/event');

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
        var parameters = {
            "location": {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [req.body.lat, req.body.lon]
                    },
                    $maxDistance: req.body.maxDistance,
                    $minDistance: 0
                }
            }
        }
        if (req.body.start != null) parameters.start = { $gte: (new Date(req.body.start)) }
        if (req.body.name != null) parameters.name = { $regex: req.body.name }
        if (req.body.genres != null && req.body.genres != []) parameters.genres = { $in: req.body.genres }

        const searched_events = await Event.searchEvents(parameters)
        res.status(200).send({ "success": true, "data": searched_events })

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

const uploadEvent = async (req, res) => {
    var eventToAdd = new Event(req.body.data)

    const event = await Event.findEventByNameAndStart(eventToAdd)

    if (event == null) {
        try {
            const addedEvent = await Event.uploadEventOnMongoDB(eventToAdd)
            if (addedEvent == null) {
                throw "Error uploading event"
            }

            // const response = await Event.uploadEventOnNeo4j(addedEvent)
            res.status(200).send({ "success": true, "data": null })
        } catch (error) {
            console.log(error)
            res.status(200).send({ "success": false, "data": "Event not added" })
        }
    } else {
        res.status(200).send({ "success": true, "data": "Event already present" })
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
    const events = await Event.getAllEvents();
    res.status(200).send({ "success": true, "data": events })
}

const updateUpcomingEvents = async (req, res) => {
    try {
        // console.log("aaaaaaaaaaaaaaa")
        const response = await Event.updateUpcomingEvents();
        res.status(200).send({ "success": true, data: response });
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: null })
    }
}

module.exports = {
    eventByFacebook,
    amountEventsScraped,
    recentData,
    searchEvents,
    eventById,
    uploadEvent,
    allEvents,
    uploadExistingEventOnNeo4j,
    updateUpcomingEvents
}
