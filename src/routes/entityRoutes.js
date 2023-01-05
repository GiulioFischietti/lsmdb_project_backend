const express = require('express')
const router = express.Router()
const entityController = require('../controllers/entityController');

router.get('/getEntitiesToUpdate', entityController.getEntitiesToUpdate)
router.get('/getallclubs', entityController.getAllClubs)
router.post('/updateentitydatetime', entityController.updateEntityDateTime)
router.post('/updateentity', entityController.updateEntity)
router.post('/loadentity', entityController.loadEntity)
router.get('/clubbyid', entityController.entityById)
router.get('/entitybyfacebook', entityController.entityByFacebook)
router.get('/entitybyname', entityController.entityByName)
router.get('/entitieswithlocation', entityController.entitiesWithLocation)

module.exports = router