const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController');

router.get('/userbyid', userController.userById)
router.post('/edituser', userController.updateUser)

module.exports = router