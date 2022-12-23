const express = require('express')
const router = express.Router()
const uninterestingEventController = require('../controllers/uninterestingEventController');

router.get('/checkExists', uninterestingEventController.checkExistsEvent)
router.post('/add', uninterestingEventController.addUninterestingEvent)
router.post('/getNonExistingEvents', uninterestingEventController.getNonExistingEvents)

module.exports = router
