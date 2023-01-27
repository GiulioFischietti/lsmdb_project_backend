const express = require('express')
const router = express.Router()
const entityController = require('../controllers/entityController');

router.get('/getEntitiesToUpdate', entityController.getEntitiesToUpdate)
router.get('/getallclubs', entityController.getAllClubs)
router.post('/updateentitydatetime', entityController.updateEntityDateTime)
router.post('/updateentity', entityController.updateEntity)
router.post('/followentity', entityController.followEntity)
router.post('/unfollowentity', entityController.unfollowEntity)
router.post('/loadentity', entityController.loadEntity)
router.get('/entitybyid', entityController.entityById)
router.get('/entitybyfacebook', entityController.entityByFacebook)
router.get('/topratedentities', entityController.getTopRatedEntities)
router.get('/entitybyname', entityController.entityByName)
router.get('/entitieswithlocation', entityController.entitiesWithLocation)
router.post('/search', entityController.searchEntities)

module.exports = router