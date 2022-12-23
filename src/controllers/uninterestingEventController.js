const { UninterestingEvent } = require('../models/uninterestingEvent');


const checkExistsEvent = async (req, res) => {
    try {
        const response = await UninterestingEvent.checkExists(req.query.facebook);
        res.status(200).send({ "success": true, data: response != null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}

const getNonExistingEvents = async (req, res) => {
    try {
        const existingEvents = await UninterestingEvent.getExistingEvents(req.body.facebookLinks);
        const nonExistingEvents = req.body.facebookLinks.filter(value => !existingEvents.includes(value));
        res.status(200).send({ "success": true, data: nonExistingEvents })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}


const addUninterestingEvent = async (req, res) => {
    try {
        const event = await UninterestingEvent.checkExists(req.body.facebook)
        if (event == null)
            await UninterestingEvent.addUninterestingEvent(req.body);
        res.status(200).send({ "success": true, data: null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "success": false, data: error })
    }
}

module.exports = {
    checkExistsEvent,
    addUninterestingEvent,
    getNonExistingEvents
}