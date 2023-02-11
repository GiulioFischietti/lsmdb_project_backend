const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController');

router.post('/signup', authController.signUp)
router.post('/uploaduseronneo4j', authController.uploadUserOnNeo4j)
router.post('/signupasamanager', authController.signUpAsAManager)
router.post('/login', authController.logIn)
router.post('/loginasmanager', authController.logIn)
router.post('/usernameexists', authController.usernameExists)

module.exports = router
