const { EventToScrape } = require('../models/eventsToScrape');


const checkExistsEvent = async (req, res) => {
    try {
        const response = await EventToScrape.checkExists(req.query.facebook);
        res.status(200).send({ "success": true, data: response != null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}

const getNonExistingEvents = async (req, res) => {
    try {
        const existingEvents = await EventToScrape.getExistingEvents(req.body.facebookLinks);
        const nonExistingEvents = req.body.facebookLinks.filter(value => !existingEvents.includes(value));
        res.status(200).send({ "success": true, data: nonExistingEvents })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}

const getEventsToScrape = async (req, res) => {
    try {
        const eventsToScrape = await EventToScrape.getEventsToScrape();
        res.status(200).send({ "success": true, data: eventsToScrape })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}



const addEventToScrape = async (req, res) => {
    try {
        const event = await EventToScrape.checkExists(req.body.facebook)
        if (event == null)
            await EventToScrape.addEventToScrape(req.body);
        res.status(200).send({ "success": true, data: null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}




const discardEventToScrape = async (req, res) => {
    try {
        EventToScrape.discardEvent(req.body.facebookLink, req.body.reason)
        res.status(200).send({ "success": true, data: {"data": null} })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}

module.exports = {
    checkExistsEvent,
    addEventToScrape,
    getNonExistingEvents,
    getEventsToScrape,
    discardEventToScrape
}