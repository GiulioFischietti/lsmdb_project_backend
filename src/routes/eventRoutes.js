const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController');

router.get('/eventbyfacebook', eventController.eventByFacebook)
router.get('/eventsbyentity', eventController.eventsByEntity)
router.get('/amounteventsscraped', eventController.amountEventsScraped)
router.get('/recentdata', eventController.recentData)
router.post('/searchevents', eventController.searchEvents)
router.post('/likeevent', eventController.likeEvent)
router.post('/dislikeevent', eventController.dislikeEvent)
router.get('/eventbyid', eventController.eventById)
router.post('/uploadevent', eventController.uploadEvent)
router.post('/updateevent', eventController.updateEvent)
router.get('/allevents', eventController.allEvents)
router.post('/uploadexistingeventonneo4j', eventController.uploadExistingEventOnNeo4j)

module.exports = router