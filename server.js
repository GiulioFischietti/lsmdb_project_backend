var states = ['afghanistan', 'albania', 'algeria', 'andorra', 'angola', 'anguilla', 'antartide', 'antigua e barbuda', 'arabia saudita', 'argentina', 'armenia', 'aruba', 'australia', 'austria', 'azerbaigian', 'bahamas', 'bahrein', 'bangladesh', 'barbados', 'belgio', 'belize', 'benin', 'bermuda', 'bhutan', 'bielorussia', 'birmania', 'bolivia', 'bosnia ed erzegovina', 'botswana', 'brasile', 'brunei', 'bulgaria', 'burkina faso', 'burundi', 'cambogia', 'camerun', 'canada', 'capo verde', 'ciad', 'cile', 'cina', 'cipro', 'citt', 'colombia', 'comore', 'corea del nord', 'corea del sud', "costa d'avorio", 'costa rica', 'croazia', 'cuba', 'cura', 'danimarca', 'dominica', 'ecuador', 'egitto', 'el salvador', 'emirati arabi uniti', 'eritrea', 'estonia', 'etiopia', 'figi', 'filippine', 'finlandia', 'francia', 'gabon', 'gambia', 'georgia', 'georgia del sud e isole sandwich meridionali', 'germania', 'ghana', 'giamaica', 'giappone', 'gibilterra', 'gibuti', 'giordania', 'grecia', 'grenada', 'groenlandia', 'guadalupa', 'guam', 'guatemala', 'guernsey', 'guinea', 'guinea-bissau', 'guinea equatoriale', 'guyana', 'guyana francese', 'haiti', 'honduras', 'hong kong', 'india', 'indonesia', 'iran', 'iraq', 'irlanda', 'islanda', 'isola bouvet', 'isola di man', 'isola di natale', 'isola norfolk', 'isole ', 'isole bes', 'isole cayman', 'isole cocos (keeling)', 'isole cook', 'f', 'isole falkland', 'isole heard e mcdonald', 'isole marianne settentrionali', 'isole marshall', 'isole minori esterne degli stati uniti', 'isole pitcairn', 'isole salomone', 'isole vergini britanniche', 'isole vergini americane', 'israele', 'jersey', 'kazakistan', 'kenya', 'kirghizistan', 'kiribati', 'kuwait', 'laos', 'lesotho', 'lettonia', 'libano', 'liberia', 'libia', 'liechtenstein', 'lituania', 'lussemburgo', 'macao', 'macedonia', 'madagascar', 'malawi', 'malesia', 'maldive', 'mali', 'malta', 'marocco', 'martinica', 'mauritania', 'mauritius', 'mayotte', 'messico', 'micronesia', 'moldavia', 'mongolia', 'montenegro', 'montserrat', 'mozambico', 'namibia', 'nauru', 'nepal', 'nicaragua', 'niger', 'nigeria', 'niue', 'norvegia', 'nuova caledonia', 'nuova zelanda', 'oman', 'paesi bassi', 'pakistan', 'palau', 'palestina', 'panam', 'papua nuova guinea', 'paraguay', 'per', 'polinesia francese', 'polonia', 'porto rico', 'portogallo', 'monaco', 'qatar', 'regno unito', 'rd del congo', 'rep. ceca', 'rep. centrafricana', 'rep. del congo', 'rep. dominicana', 'riunione', 'romania', 'ruanda', 'russia', 'sahara occidentale', 'saint kitts e nevis', 'santa lucia', "sant'elena, ascensione e tristan da cunha", 'saint vincent e grenadine', 'saint-barth', 'saint-martin', 'saint-pierre e miquelon', 'samoa', 'samoa americane', 'san marino', 's', 'senegal', 'serbia', 'seychelles', 'sierra leone', 'singapore', 'sint maarten', 'siria', 'slovacchia', 'slovenia', 'somalia', 'spagna', 'sri lanka', 'stati uniti', 'sudafrica', 'sudan', 'sudan del sud', 'suriname', 'svalbard e jan mayen', 'svezia', 'svizzera', 'swaziland', 'taiwan', 'tagikistan', 'tanzania', 'terre australi e antartiche francesi', "territorio britannico dell'oceano indiano", 'thailandia', 'timor est', 'togo', 'tokelau', 'tonga', 'trinidad e tobago', 'tunisia', 'turchia', 'turkmenistan', 'turks e caicos', 'tuvalu', 'ucraina', 'uganda', 'ungheria', 'uruguay', 'uzbekistan', 'vanuatu', 'venezuela', 'vietnam', 'wallis e futuna', 'yemen', 'zambia', 'zimbabwe']

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

    const clubs = await client.db('needfy').collection('clubs').find({ lastUpdatedEvent: { "$exists": false }, assignedTo: parseInt(req.query.machine) }).toArray();
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
                events_to_add[i].createdAt = new Date()
                await client.db('needfy').collection('events').insertOne(events_to_add[i])
            } catch (error) {
                console.log(error)
            }
        } else {
            res.status(200).send({ "success": true, "data": event })
            // for (let i = 0; i < events_to_add[0].organizers.length; i++) {
            //     var org_already_present = false

            //     for (let j = 0; j < event.organizers.length; j++) {
            //         if (event.organizers[j]._id == events_to_add[0].organizers[i]._id) {
            //             org_already_present = true
            //         }
            //     }
                
            //     if (!org_already_present) {
            //         client.db('needfy').collection('events').updateOne(
            //             { _id: event._id },
            //             { $push: { organizers: events_to_add[0].organizers[i] } }
            //         )
            //     }

            // }
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
        const club2 = await client.db('needfy').collection('clubs').findOne({ facebook: req.body.data[i].facebook.slice(0, -1) })

        if ((club == null) && (club2 == null)) {
            try {
                req.body.data[i].createdAt = new Date()
                data = await client.db('needfy').collection('clubs').insertOne(req.body.data[i])
                data._id = data.insertedId
            } catch (error) {
                console.log(error)
                res.status(200).send({ "success": true, "data": null })
            }
        } else {
            data = club != null ? club : club2
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
                req.body.data[i].createdAt = new Date()
                data = await client.db('needfy').collection('artists').insertOne(req.body.data[i])
                data._id = data.insertedId
            } catch (error) {
                console.log(error)
                res.status(200).send({ "success": true, "data": null })
            }
        } else {
            data = club
        }
    }

    res.status(200).send({ "success": true, "data": data })
})

app.get('/getduplicatesevents', async (req, res) => {

    var groupedevents = await client.db('needfy').collection('events').aggregate([{ "$group": { "_id": { "name": "$name", "start:": "$start", "end": "$end" }, "count": { "$sum": 1 }, events: { $push: "$$ROOT" } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gt": 1 } } }, { "$sort": { "count": -1 } }], { allowDiskUse: true }).toArray()
    // var events = []
    // for (let i = 0; i < groupedevents.length; i++) {
    //     console.log("Updating events of artist " + groupedevents[i].events[0].name)
    //     var events = await client.db('needfy')
    //         .collection('events')
    //         .updateMany({ "artist.name": groupedevents[i].events[0].name }, { "$set": { "artist": groupedevents[i].events[0] } })
    // for (let j = 0; j < groupedClubs[i].clubs.length; j++) {
    //     oldest_id = groupedClubs[i].clubs[0]._id;

    // events.push(await client.db('needfy')
    // .collection('events')
    // .find({"club.name": groupedClubs[i].clubs[j].name})
    // .toArray())
    // console.log(groupedClubs[i].clubs[0]._id + ', ' + groupedClubs[i].clubs[j]._id)
    // console.log(ObjectId(groupedClubs[i].clubs[0]._id) > ObjectId(groupedClubs[i].clubs[j]._id))
    // }

    // }
    res.status(200).send({ "success": true, "data": groupedevents })

})

app.post('/loadorganizers', async (req, res) => {

    var duplicates = []
    console.log("loading organizers... ")
    console.log(req.body.data[0])
    var data
    for (let i = 0; i < req.body.data.length; i++) {
        const club = await client.db('needfy').collection('organizers').findOne({ facebook: req.body.data[i].facebook })
        const club2 = await client.db('needfy').collection('organizers').findOne({ facebook: req.body.data[i].facebook.slice(0, -1) })
        if ((club == null) && (club2 == null)) {
            try {
                req.body.data[i].createdAt = new Date()
                data = await client.db('needfy').collection('organizers').insertOne(req.body.data[i])
                data._id = data.insertedId
            } catch (error) {
                console.log(error)
            }
        } else {
            data = club != null ? club : club2
        }
    }

    res.status(200).send({ "success": true, "data": data })
})

app.get('/standardizeclubs', async (req, res) => {
    try {

        var clubstofix = await client.db('needfy').collection('clubs').find({ facebook: { $regex: ".+\/$" } }).toArray()
        for (let i = 0; i < clubstofix.length; i++) {
            await client.db('needfy').collection('clubs').updateOne({ _id: clubstofix[i]._id },
                {
                    $set:
                        { facebook: clubstofix[i].facebook.slice(0, -1) }
                })
        }


        // var near_clubs = await client.db('needfy').collection('clubs_test').updateMany(
        //     { facebook: { $regex: ".+\/$" } },
        //     [


        //                 facebook: {
        //                     $slice: ["$facebook", 0, -1]
        //                 }
        //             }
        //         }]
        // )
        res.status(200).send({ "success": true, "data": clubstofix })

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
        res.status(500).send({ "error": error, "data": null })
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
        res.status(500).send({ "error": error, "data": artist })
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