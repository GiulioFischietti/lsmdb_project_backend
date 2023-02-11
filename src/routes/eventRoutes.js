const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController');

router.get('/eventbyfacebook', eventController.eventByFacebook)
router.get('/suggestedevents', eventController.getSuggestedEvents)
router.get('/eventsbyentity', eventController.eventsByEntity)
router.get('/amounteventsscraped', eventController.amountEventsScraped)
router.get('/recentdata', eventController.recentData)
router.post('/searchevents', eventController.searchEvents)
router.post('/likeevent', eventController.likeEvent)
router.post('/likeevents', eventController.likeEventsNeo4j)
router.post('/dislikeevent', eventController.dislikeEvent)
router.get('/eventbyid', eventController.eventById)
router.get('/managereventbyid', eventController.managerEventById)
router.post('/uploadevent', eventController.uploadEvent)
router.post('/updateevent', eventController.updateEvent)
router.post('/deleteevent', eventController.deleteEvent)
router.get('/allevents', eventController.allEvents)
router.post('/uploadexistingeventonneo4j', eventController.uploadExistingEventOnNeo4j)
router.get('/variegatedclubs', eventController.variegatedClubs)

module.exports = router