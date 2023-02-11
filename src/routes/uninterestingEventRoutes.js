const express = require('express')
const router = express.Router()
const uninterestingEventController = require('../controllers/uninterestingEventController');

router.get('/checkExists', uninterestingEventController.checkExistsEvent)
router.post('/add', uninterestingEventController.addEventToScrape)
router.post('/discardEvent', uninterestingEventController.discardEventToScrape)
router.post('/getNonExistingEvents', uninterestingEventController.getNonExistingEvents)
router.get('/getEventsToScrape', uninterestingEventController.getEventsToScrape)

module.exports = router
