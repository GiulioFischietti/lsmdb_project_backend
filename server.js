
const express = require('express')
var { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { db } = require('../project_backend/myExpressApp/models/event');
const client = new MongoClient(process.env.DATABASE_URL);

// const appRouter = require('./routes/approuter')


app.use(bodyParser.json());
app.use(express.json())
// app.use('/api', appRouter)
app.listen(3000, () => console.log("Server started"))


client.connect().then(() => console.log("DB connected"));



// AUTHENTICATION

app.get('/users', async (req, res) => {
    try {
        // console.log(client.db('needfy').collection('users').find({}))
        const users = await client.db('needfy').collection('users').find({}).toArray()

        res.json(users)
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.post('/signup', async (req, res) => {
    try {
        const users = await client.db('needfy').collection('users').find({ email: req.body.email }).toArray();

        if (users.length == 0) {

            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const newUser = await client.db('needfy').collection('users').insertOne({ "name": req.body.name, "email": req.body.email, "psw": hashedPassword, "created_at": new Date() })
            res.status(200).send({ success: true, data: newUser });
        }
        else {
            res.status(200).send({ success: false, data: "Email already registered" })
        }
    } catch (error) {
        console.log(error)
        res.status(500).send({ success: false, data: error })
    }
})

app.post('/login', async (req, res) => {
    const user = await client.db('needfy').collection('users').findOne({ email: req.body.email })
    console.log(user)
    if (user != null) {
        try {
            if (await bcrypt.compare(req.body.password, user.psw))
                res.send({ "success": true, data: user })
            else res.status(403).send({ "success": false, data: "Wrong email/password" })
        } catch (error) {
            console.log(error)
            res.status(500).send()
        }
    }
    else {
        res.status(403).send({ success: false, data: "User not registered" });
    }
})

// EVENTS


app.post('/nearevents', async (req, res) => {
    try {

        var near_events = await client.db('needfy').collection('events').find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [req.body.lat, req.body.lon]
                    },
                    $maxDistance: req.body.max_distance,
                    $minDistance: 0
                }
            }
        }).limit(8).toArray()

        res.status(200).send({ "success": true, "data": near_events })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})


app.post('/searchevents', async (req, res) => {
    try {
        var parameters = {
            "location": {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [req.body.lat, req.body.lon]
                    },
                    $maxDistance: req.body.max_distance,
                    $minDistance: 0
                }
            }
        }
        req.body.start != null ? parameters.start = { $gte: (new Date(req.body.start)).toISOString() } : null
        req.body.name != null ? parameters.name = { $regex: req.body.name } : null
        req.body.genres != null ? parameters.genres = { $in: req.body.genres } : null
        
        const searched_events = await client.db('needfy').collection('events').find(parameters).sort({ "start": -1 }).limit(8).toArray()
        res.status(200).send({ "success": true, "data": searched_events })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.post('/nearclubs', async (req, res) => {
    try {

        var near_clubs = await client.db('needfy').collection('clubs').find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [req.body.lat, req.body.lon]
                    },
                    $maxDistance: req.body.max_distance,
                    $minDistance: 0
                }
            }
        }).limit(8).toArray()
        res.status(200).send({ "success": true, "data": near_clubs })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.get('/organizerbyid', async (req, res) => {
    try {

        var organizer = await client.db('needfy').collection('organizers').findOne({
            _id: ObjectId(req.query._id)
        })
        res.status(200).send({ "success": true, "data": organizer })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/eventbyid', async (req, res) => {
    try {

        console.log(req.query)

        var event = await client.db('needfy').collection('events').findOne({
            _id: ObjectId(req.query._id)
        })
        res.status(200).send({ "success": true, "data": event })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/clubbyid', async (req, res) => {
    try {

        var club = await client.db('needfy').collection('clubs').findOne({
            _id: ObjectId(req.query._id)
        })
        res.status(200).send({ "success": true, "data": club })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/userbyid', async (req, res) => {
    try {
        var user = await client.db('needfy').collection('users').findOne({
            _id: ObjectId(req.query._id)
        })
        res.status(200).send({ "success": true, "data": user })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.post('/edituser', async (req, res) => {
    const params = {...req.body};
    delete params._id;
    
    try {
        await client.db('needfy').collection('users').updateOne({
            _id: ObjectId(req.body._id)
        }, { $set: params }, { upsert: false })
        res.status(200).send({ "success": true })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})