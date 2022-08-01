
const express = require('express')
const neo4j = require('neo4j-driver')
var { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config()

const app = express()
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { db } = require('../project_backend/myExpressApp/models/event');
const client = new MongoClient(process.env.DATABASE_URL);

// const appRouter = require('./routes/approuter')

const {
    GRAPHDB_URL,
    db_username,
    db_password,
    database,
} = process.env
var driver = neo4j.driver(
    'bolt://localhost',
    neo4j.auth.basic('neo4j', 'ssss')
)

const session = driver.session();


app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
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
            const result = await session.run('CREATE (n:User {name: "' + req.body.name + '" , _id: "' + newUser.insertedId + '" , email: "' + req.body.email + '" })')

            // CREATE (n:Person {name: req.body.name, email: req.body.email, psw: hashedPassword, created_at: new Date()  })
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
        if (req.body.start != null) parameters.start = { $gte: (new Date(req.body.start)).toISOString() }
        if (req.body.name != null) parameters.name = { $regex: req.body.name }
        if (req.body.genres != null && req.body.genres != []) parameters.genres = { $in: req.body.genres }

        const searched_events = await client.db('needfy').collection('events').find(parameters).sort({ "start": -1 }).limit(8).toArray()

        res.status(200).send({ "success": true, "data": searched_events })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/getallclubs', async (req, res) => {
    const clubs = await client.db('needfy').collection('clubs').find({lastUpdatedEvent: {"$exists": false}}).toArray();
    res.status(200).send({ "success": true, "data": clubs })
})


app.post('/updateclubdatetime', async (req, res) => {
    const club = await client.db('needfy').collection('clubs').updateOne({ _id: ObjectId(req.body.id) }, { $set: { lastUpdatedEvent: new Date() } });
    res.status(200).send({ "success": true, data: club });
})


app.post('/loadevents', async (req, res) => {

    var duplicates = []
    // body = JSON.parse(req.body)
    var events_to_add = req.body.data

    for (let i = 0; i < events_to_add.length; i++) {
        const event = await client.db('needfy').collection('events').findOne({ name: events_to_add[i].name, start: events_to_add[i].start })
        // console.log(event)
        if (event == null) {
            console.log(events_to_add[i])
            try {
                // if ("club" in events_to_add[i]) {
                //     var club = await client.db('needfy').collection('clubs').findOne({ name: events_to_add[i].club.name })
                //     if (club == null) {
                //         club = await client.db('needfy').collection('clubs').insertOne(events_to_add[i].club)
                //     }
                //     events_to_add[i].club._id = club._id
                // }

                await client.db('needfy').collection('events').insertOne(events_to_add[i])
                // for (let k = 0; k < events_to_add[i].organizers.length; k++) {

                //     if (events_to_add[i].organizers[k].type == "organizer") {
                //         var organizer = await client.db('needfy').collection('organizers').findOne({ name: events_to_add[i].organizers[k].name })
                //         if (organizer == null) {
                //             delete events_to_add[i].organizers[k].type
                //             organizer = await client.db('needfy').collection('organizers').insertOne(events_to_add[i].organizers[k])
                //             events_to_add[i].organizers[k]._id = organizer.insertedId
                //         }
                //         else {
                //             events_to_add[i].organizers[k]._id = organizer._id
                //         }
                //         events_to_add[i].organizers[k].type = "organizer"
                //     }

                //     if (events_to_add[i].organizers[k].type == "club") {
                //         // se tra gli organizzatori c'è un club, cerchiamo nella collection dei club così da mettere l'id club dentro il campo "club_id" di event.organizers.club_id
                //         delete events_to_add[i].organizers[k].type
                //         var club_org = await client.db('needfy').collection('clubs').findOne({ name: events_to_add[i].organizers[k].name })
                //         if (club_org == null) {
                //             club_org = await client.db('needfy').collection('clubs').insertOne(events_to_add[i].organizers[k])
                //             events_to_add[i].organizers[k]._id = club_org.insertedId
                //         } else {
                //             events_to_add[i].organizers[k]._id = club_org._id
                //         }
                //         events_to_add[i].organizers[k].type = "club"
                //     }

                //     if (events_to_add[i].organizers[k].type == "artist") {
                //         console.log("ARTISTA RILEVATO")
                //         delete events_to_add[i].organizers[k].type
                //         // se tra gli organizzatori c'è un artist, cerchiamo nella collection dei artist così da mettere l'id artist dentro il campo "artist_id" di event.organizers.artist_id
                //         var artist_org = await client.db('needfy').collection('artists').findOne({ name: events_to_add[i].organizers[k].name })
                //         if (artist_org == null) {
                //             console.log("ARTISTA NON PRESENTE")
                //             console.log(events_to_add[i].organizers[k].name)
                //             artist_org = await client.db('needfy').collection('artists').insertOne(events_to_add[i].organizers[k])
                //             console.log("ARTISTA AGGIUNTO")
                //             events_to_add[i].organizers[k]._id = artist_org.insertedId
                //         }
                //         else {
                //             console.log("ARTISTA GIA PRESENTE: ")
                //             console.log(artist_org)
                //             events_to_add[i].organizers[k]._id = artist_org._id
                //         }
                //         events_to_add[i].organizers[k].type = "artist"
                //     }

                // }

            } catch (error) {
                console.log(error)
            }
        } else {
            duplicates.push(event)
        }
    }

    res.status(200).send({ "success": true, "data": { "message": "Successfully added " + (req.body.data.length - duplicates.length) + " events", "duplicates": duplicates } })
})



app.post('/loadclubs', async (req, res) => {

    console.log("loading club... ")
    console.log(req.body.data[0])
    var data
    for (let i = 0; i < req.body.data.length; i++) {
        const club = await client.db('needfy').collection('clubs').findOne({ facebook: req.body.data[i].facebook })
        if (club == null) {
            try {
                data = await client.db('needfy').collection('clubs').insertOne(req.body.data[i])
                data._id = data.insertedId
            } catch (error) {
                console.log(error)
            }
        } else {
            data = club
        }
    }

    res.status(200).send({ "success": true, "data": data })
})

app.post('/loadartists', async (req, res) => {

    var duplicates = []
    console.log("loading artists... ")
    console.log(req.body.data[0])
    var data
    for (let i = 0; i < req.body.data.length; i++) {
        const club = await client.db('needfy').collection('artists').findOne({ facebook: req.body.data[i].facebook })
        if (club == null) {
            try {
                data = await client.db('needfy').collection('artists').insertOne(req.body.data[i])
                data._id = data.insertedId
            } catch (error) {
                console.log(error)
            }
        } else {
            data = club
        }
    }

    res.status(200).send({ "success": true, "data": data })
})

app.post('/loadorganizers', async (req, res) => {

    var duplicates = []
    console.log("loading organizers... ")
    console.log(req.body.data[0])
    var data
    for (let i = 0; i < req.body.data.length; i++) {
        const club = await client.db('needfy').collection('organizers').findOne({ facebook: req.body.data[i].facebook })
        if (club == null) {
            try {
                data = await client.db('needfy').collection('organizers').insertOne(req.body.data[i])
                data._id = data.insertedId
            } catch (error) {
                console.log(error)
            }
        } else {
            data = club
        }
    }

    res.status(200).send({ "success": true, "data": data })
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
        const result = await session.run("match (a:User), (b:Organizer) where a._id = '" + req.query.user_id + "' and b._id = '" + req.query._id + "' return exists((a)-[:Follows]->(b));")
        organizer.is_followed = result.records[0]._fields[0];

        res.status(200).send({ "success": true, "data": organizer })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/organizerbyfacebook', async (req, res) => {
    try {

        var organizer = await client.db('needfy').collection('organizers').findOne({
            facebook: req.query.facebook
        })

        res.status(200).send({ "success": true, "data": organizer })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/clubbyfacebook', async (req, res) => {
    try {

        var club = await client.db('needfy').collection('clubs').findOne({
            facebook: req.query.facebook
        })

        res.status(200).send({ "success": true, "data": club })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/eventbyfacebook', async (req, res) => {
    try {

        var event = await client.db('needfy').collection('events').findOne({
            facebook: req.query.facebook
        })
        console.log(event)
        console.log(req.query.facebook)
        res.status(200).send({ "success": true, "data": event })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/artistbyfacebook', async (req, res) => {
    try {

        var artist = await client.db('needfy').collection('artists').findOne({
            facebook: req.query.facebook
        })

        res.status(200).send({ "success": true, "data": artist })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})


app.get('/eventbyid', async (req, res) => {
    try {

        // const result = await session.run('match (a:User)-[r:Follows]->(b:Club) where a.id = 1  and b.name = 'Lumiere' return r;')

        var event = await client.db('needfy').collection('events').findOne({
            _id: ObjectId(req.query._id)
        })
        const result = await session.run("match (a:User), (b:Event) where a._id = '" + req.query.user_id + "' and b._id = '" + req.query._id + "' return exists((a)-[:ParticipatesIn]->(b));")
        event.participates = result.records[0]._fields[0];

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
        const result = await session.run("match (a:User), (b:Club) where a._id = '" + req.query.user_id + "' and b._id = '" + req.query._id + "' return exists((a)-[:Follows]->(b));")
        club.is_followed = result.records[0]._fields[0];
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
    const params = { ...req.body };
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