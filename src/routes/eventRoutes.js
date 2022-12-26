const express = require('express')
const router = express.Router()
const eventController = require('../controllers/eventController');

router.get('/eventbyfacebook', eventController.eventByFacebook)
router.get('/amounteventsscraped', eventController.amountEventsScraped)
router.get('/recentdata', eventController.recentData)
router.post('/searchevents', eventController.searchEvents)
router.get('/eventbyid', eventController.eventById)
router.post('/uploadevent', eventController.uploadEvent)
router.get('/allevents', eventController.allEvents)
router.post('/uploadexistingeventonneo4j', eventController.uploadExistingEventOnNeo4j)
router.get('/updateUpcomingEvents', eventController.updateUpcomingEvents)


module.exports = router