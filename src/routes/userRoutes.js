const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController');

router.get('/userbyid', userController.userById)
router.post('/edituser', userController.updateUser)
router.post('/followuseronneo4j', userController.followUserOnNeo4j)
router.post('/followentityonneo4j', userController.followedEntitiesOnNeo4j)
router.post('/followuser', userController.followUser)
router.post('/unfollowuser', userController.unfollowUser)
router.post('/followers', userController.getFollowers)
router.post('/followings', userController.getFollowings)
router.post('/suggestedfriendsofuser', userController.getSuggestedFriendsOfUser)
router.post('/likedevents', userController.getLikedEvents)
router.get('/criticusers', userController.getCriticUsers)
router.post('/suggestedfriendsbasedonlikes', userController.getSuggestedFriendsBasedOnLikes)
router.post('/delete', userController.deleteUser)
router.get('/all', userController.getAllUsers)

module.exports = router