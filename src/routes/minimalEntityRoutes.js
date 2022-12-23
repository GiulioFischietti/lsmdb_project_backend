const express = require('express')
const router = express.Router()
const minimalEntityController = require('../controllers/minimalEntityController');

router.get('/minimalentitybyfacebook', minimalEntityController.minimalEntityByFacebook)

module.exports = router
