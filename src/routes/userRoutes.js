const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController');

router.get('/userbyid', userController.userById)
router.post('/edituser', userController.updateUser)
router.post('/followentity', userController.followEntity)
router.post('/unfollowentity', userController.unFollowEntity)
router.post('/likeevent', userController.likeEvent)
router.post('/dislikeevent', userController.dislikeEvent)

module.exports = router