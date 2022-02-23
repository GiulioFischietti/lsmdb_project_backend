const express = require('express')
const router = express.Router()

const {
    signup,
    login,
    getusers
} = require('../controllers/user.js')

const {
    nearEvents
} = require('../controllers/event.js')

// Authentication 
router.get('/users', getusers)
router.post('/signup', signup)
router.post('/login', login)

// Events
router.post('/nearevents', nearEvents)

module.exports = router