const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController');

router.post('/signup', authController.signUp)
router.post('/signupasamanager', authController.signUpAsAManager)
router.post('/login', authController.logIn)
router.post('/loginasmanager', authController.logIn)
router.post('/usernameexists', authController.usernameExists)

module.exports = router
