var states = ['afghanistan', 'albania', 'algeria', 'andorra', 'angola', 'anguilla', 'antartide', 'antigua e barbuda', 'arabia saudita', 'argentina', 'armenia', 'aruba', 'australia', 'austria', 'azerbaigian', 'bahamas', 'bahrein', 'bangladesh', 'barbados', 'belgio', 'belize', 'benin', 'bermuda', 'bhutan', 'bielorussia', 'birmania', 'bolivia', 'bosnia ed erzegovina', 'botswana', 'brasile', 'brunei', 'bulgaria', 'burkina faso', 'burundi', 'cambogia', 'camerun', 'canada', 'capo verde', 'ciad', 'cile', 'cina', 'cipro', 'citt', 'colombia', 'comore', 'corea del nord', 'corea del sud', "costa d'avorio", 'costa rica', 'croazia', 'cuba', 'cura', 'danimarca', 'dominica', 'ecuador', 'egitto', 'el salvador', 'emirati arabi uniti', 'eritrea', 'estonia', 'etiopia', 'figi', 'filippine', 'finlandia', 'francia', 'gabon', 'gambia', 'georgia', 'georgia del sud e isole sandwich meridionali', 'germania', 'ghana', 'giamaica', 'giappone', 'gibilterra', 'gibuti', 'giordania', 'grecia', 'grenada', 'groenlandia', 'guadalupa', 'guam', 'guatemala', 'guernsey', 'guinea', 'guinea-bissau', 'guinea equatoriale', 'guyana', 'guyana francese', 'haiti', 'honduras', 'hong kong', 'india', 'indonesia', 'iran', 'iraq', 'irlanda', 'islanda', 'isola bouvet', 'isola di man', 'isola di natale', 'isola norfolk', 'isole ', 'isole bes', 'isole cayman', 'isole cocos (keeling)', 'isole cook', 'f', 'isole falkland', 'isole heard e mcdonald', 'isole marianne settentrionali', 'isole marshall', 'isole minori esterne degli stati uniti', 'isole pitcairn', 'isole salomone', 'isole vergini britanniche', 'isole vergini americane', 'israele', 'jersey', 'kazakistan', 'kenya', 'kirghizistan', 'kiribati', 'kuwait', 'laos', 'lesotho', 'lettonia', 'libano', 'liberia', 'libia', 'liechtenstein', 'lituania', 'lussemburgo', 'macao', 'macedonia', 'madagascar', 'malawi', 'malesia', 'maldive', 'mali', 'malta', 'marocco', 'martinica', 'mauritania', 'mauritius', 'mayotte', 'messico', 'micronesia', 'moldavia', 'mongolia', 'montenegro', 'montserrat', 'mozambico', 'namibia', 'nauru', 'nepal', 'nicaragua', 'niger', 'nigeria', 'niue', 'norvegia', 'nuova caledonia', 'nuova zelanda', 'oman', 'paesi bassi', 'pakistan', 'palau', 'palestina', 'panam', 'papua nuova guinea', 'paraguay', 'per', 'polinesia francese', 'polonia', 'porto rico', 'portogallo', 'monaco', 'qatar', 'regno unito', 'rd del congo', 'rep. ceca', 'rep. centrafricana', 'rep. del congo', 'rep. dominicana', 'riunione', 'romania', 'ruanda', 'russia', 'sahara occidentale', 'saint kitts e nevis', 'santa lucia', "sant'elena, ascensione e tristan da cunha", 'saint vincent e grenadine', 'saint-barth', 'saint-martin', 'saint-pierre e miquelon', 'samoa', 'samoa americane', 'san marino', 's', 'senegal', 'serbia', 'seychelles', 'sierra leone', 'singapore', 'sint maarten', 'siria', 'slovacchia', 'slovenia', 'somalia', 'spagna', 'sri lanka', 'stati uniti', 'sudafrica', 'sudan', 'sudan del sud', 'suriname', 'svalbard e jan mayen', 'svezia', 'svizzera', 'swaziland', 'taiwan', 'tagikistan', 'tanzania', 'terre australi e antartiche francesi', "territorio britannico dell'oceano indiano", 'thailandia', 'timor est', 'togo', 'tokelau', 'tonga', 'trinidad e tobago', 'tunisia', 'turchia', 'turkmenistan', 'turks e caicos', 'tuvalu', 'ucraina', 'uganda', 'ungheria', 'uruguay', 'uzbekistan', 'vanuatu', 'venezuela', 'vietnam', 'wallis e futuna', 'yemen', 'zambia', 'zimbabwe']

const express = require('express')
const neo4j = require('neo4j-driver')
var { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config()
const cors = require('cors');

const app = express();

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


app.use(cors())
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


app.get('/recentdata', async (req, res) => {
    var addedRecently = await client.db('needfy').collection('events').find().sort({ createdAt: -1 }).limit(8).toArray();
    res.json({ success: true, "data": addedRecently })
})

app.get('/amounteventsscraped', async (req, res) => {
    try {
        // console.log(client.db('needfy').collection('users').find({}))
        const events_count = await client.db('needfy').collection('events').countDocuments()
        var addedToday = await client.db('needfy').collection('events').countDocuments({
            createdAt: {
                $gte: new Date(new Date() - 60 * 60 * 24 * 1000)
            }
        })
        console.log(addedToday)
        res.json({ success: true, "data": { "category": "Events", "amount": events_count, "addedToday": addedToday } })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.get('/amountartistsscraped', async (req, res) => {
    try {
        // console.log(client.db('needfy').collection('users').find({}))
        const artists_count = await client.db('needfy').collection('artists').countDocuments()
        var addedToday = await client.db('needfy').collection('artists').countDocuments({
            createdAt: {
                $gte: new Date(new Date() - 60 * 60 * 24 * 1000)
            }
        })
        console.log(addedToday)
        res.json({ success: true, "data": { "category": "Artists", "amount": artists_count, "addedToday": addedToday } })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.get('/amountorganizersscraped', async (req, res) => {
    try {
        // console.log(client.db('needfy').collection('users').find({}))
        const organizers_count = await client.db('needfy').collection('organizers').countDocuments()
        var addedToday = await client.db('needfy').collection('organizers').countDocuments({
            createdAt: {
                $gte: new Date(new Date() - 60 * 60 * 24 * 1000)
            }
        })
        console.log(addedToday)
        res.json({ success: true, "data": { "category": "Organizers", "amount": organizers_count, "addedToday": addedToday } })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.get('/amountclubsscraped', async (req, res) => {
    try {
        // console.log(client.db('needfy').collection('users').find({}))
        const clubs_count = await client.db('needfy').collection('clubs').countDocuments()
        var addedToday = await client.db('needfy').collection('clubs').countDocuments({
            createdAt: {
                $gte: new Date(new Date() - 60 * 60 * 24 * 1000)
            }
        })
        console.log(addedToday)
        res.json({ success: true, "data": { "category": "Clubs", "amount": clubs_count, "addedToday": addedToday } })
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

app.post('/updateeventorganizers', async (req, res) => {
    try {
        var organizers_retrieved = []
        var missing_organizers = 0
        for (let i = 0; i < req.body.event.organizers.length; i++) {

            var organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: req.body.event.organizers[i] })
            if (organizer != null) {
                organizers_retrieved.push(organizer)
            } else {
                missing_organizers++
                organizers_retrieved.push(req.body.event.organizers[i])
            }
        }
        console.log(missing_organizers + ' missing organizers\n')
        client.db('needfy').collection('events').updateOne({ _id: ObjectId(req.body.event._id) }, { $set: { organizers_updated: true, organizers: organizers_retrieved } })
        res.status(200).send({ "success": true, "data": null })
    }
    catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/getorganizerstosynctype', async (req, res) => {
    try {
        const organizers_notype = await client.db('needfy').collection('collapsed_organizers').find({ updatedType: { $exists: false } }).toArray()

        res.status(200).send({ "success": true, "data": organizers_notype })
    } catch (e) {
        console.log(e)
        res.status(500).send({ "error": error })
    }
})

app.get('/getorganizerstosyncfacebook', async (req, res) => {
    try {
        const organizers_wrong_link = await client.db('needfy').collection('collapsed_organizers').find({ facebook: { $regex: "-" } }).sort({ _id: 1 }).toArray()

        res.status(200).send({ "success": true, "data": organizers_wrong_link })
    } catch (e) {
        console.log(e)
        res.status(500).send({ "error": error })
    }
})


app.get('/sync_all_organizers_of_events', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")

        for (let i = 0; i < searched_events.length; i++) {

            if ((counter % 1000) == 0) { console.log(counter / 920) }
            var new_organizers = []
            for (let j = 0; j < searched_events[i].organizers.length; j++) {
                var other_organizer = await client.db('needfy').collection("collapsed_organizers").findOne({ facebook: searched_events[i].organizers[j].facebook })
                if (other_organizer != null) {
                    new_organizers.push(other_organizer)
                }


            }

            counter++
            client.db('needfy').collection("events").updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { organizers: new_organizers } })

        }
        res.status(200).send({ "success": true, "data": null })
    } catch (e) {
        console.log(e)
    }
})
app.get('/count_missing_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")

        var missing_counter = 0
        for (let i = 0; i < searched_events.length; i++) {

            if ((counter % 1000) == 0) { console.log(counter / 75000) }



            for (let j = 0; j < searched_events[i].organizers.length; j++) {
                var other_organizer = await client.db('needfy').collection("collapsed_organizers").findOne({ _id: ObjectId(searched_events[i].organizers[j]._id), facebook: searched_events[i].organizers[j].facebook })
                if (other_organizer == null) { missing_counter++ }
            }
            counter++
        }
        res.status(200).send({ "success": true, "data": missing_counter })
    } catch (e) {
        console.log(e)
    }
})
app.get('/sync_oldevents_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({ createdAt: { $lte: (new Date("2022-04-25")) } }).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_retrieved = [];
            if ((counter % 1000) == 0) { console.log(counter / 75000) }

            if (searched_events[i].club != null) {
                organizers_retrieved.push(searched_events[i].club)
            }
            if (searched_events[i].organizer != null) {
                var organizer = await client.db('needfy').collection(searched_events[i].organizer.type + 's').findOne({ id: searched_events[i].organizer.id })
                if (organizer != null) { organizers_retrieved.push(organizer) }
                // await club.db('needfy').collection('events').updateOne({_id: ObjectId(searched_events[i]._id)}, )
            }
            if (searched_events[i].other_organizers != null) {
                for (let j = 0; j < searched_events[i].other_organizers.length; j++) {
                    var other_organizer = await client.db('needfy').collection(searched_events[i].other_organizers[j].type + 's').findOne({ id: searched_events[i].other_organizers[j].id })
                    if (other_organizer != null) { organizers_retrieved.push(other_organizer) }
                }
            }

            var clean = []

            for (let z = 0; z < organizers_retrieved.length; z++) {
                var must_add = true
                for (let p = 0; p < clean.length; p++) {
                    if (organizers_retrieved[z].facebook == clean[p].facebook) {
                        must_add = false
                        break
                    }
                }
                if (must_add) { clean.push(organizers_retrieved[z]) }

            }

            for (let k = 0; k < organizers_retrieved.length; k++) {
                if (organizers_retrieved[k] == null) {
                    console.log(searched_events[i])
                }

            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { organizers: clean } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})



app.get('/update_events_organizers_artists', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_retrieved = [];
            var artists_retrieved = [];
            if ((counter % 1000) == 0) { console.log(counter / 920) }


            for (let j = 0; j < searched_events[i].organizers.length; j++) {

                if (searched_events[i].organizers[j].type != "artist") {
                    organizers_retrieved.push(searched_events[i].organizers[j])
                } else {
                    artists_retrieved.push(searched_events[i].organizers[j])
                }
            }

            for (let j = 0; j < searched_events[i].artists.length; j++) {
                if (searched_events[i].artists[j].type != "artist") {
                    organizers_retrieved.push(searched_events[i].artists[j])
                } else {
                    artists_retrieved.push(searched_events[i].artists[j])
                }
            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "organizers": organizers_retrieved, "artists": artists_retrieved } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/sync_newevents_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting organizers...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_retrieved = [];
            if ((counter % 1000) == 0) { console.log(counter / 920) }

            if (searched_events[i].organizers != null) {
                for (let j = 0; j < searched_events[i].organizers.length; j++) {
                    var organizer = await client.db('needfy').collection("collapsed_organizers").findOne({ _id: ObjectId(searched_events[i].organizers[j]._id) })
                    if (organizer != null) { organizers_retrieved.push(organizer) } else { console.log("organier not found") }
                }
            }

            var clean = []

            for (let z = 0; z < organizers_retrieved.length; z++) {
                var must_add = true
                for (let p = 0; p < clean.length; p++) {
                    if (organizers_retrieved[z].facebook == clean[p].facebook) {
                        must_add = false
                        break
                    }
                }
                if (must_add) { clean.push(organizers_retrieved[z]) }

            }

            var must_add_club = true
            if (searched_events[i].club != null) {
                for (let p = 0; p < clean.length; p++) {
                    if (clean[p].facebook == searched_events[i].club.facebook) {
                        must_add_club = false
                        break
                    }
                }
                if (must_add_club) { clean.push(searched_events[i].club) }
            }



            for (let k = 0; k < organizers_retrieved.length; k++) {
                if (organizers_retrieved[k] == null) {
                    console.log(searched_events[i])
                }

            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "organizers": clean } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/create_artists_field', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var artists = []
            if ((counter % 1000) == 0) { console.log(counter / 75000) }

            if (searched_events[i].organizers != undefined) {
                for (let j = 0; j < searched_events[i].organizers.length; j++) {
                    if (searched_events[i].organizers[j].type == "artist") {
                        artists.push(searched_events[i].organizers[j])
                    }
                }
            } else {
                searched_events[i]
            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "artists": artists } })
            counter++
        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/remove_artists_from_organizers', async (req, res) => {
    try {
        var counter = 0;
        console.log("getting events...")
        const searched_events = await client.db('needfy').collection('events').find({}).toArray()
        console.log("done.\n")


        for (let i = 0; i < searched_events.length; i++) {
            var organizers_filtered = []
            if ((counter % 1000) == 0) { console.log(counter / 920) }

            if (searched_events[i].organizers != undefined) {
                for (let j = 0; j < searched_events[i].organizers.length; j++) {
                    if (searched_events[i].organizers[j].type != "artist") {
                        organizers_filtered.push(searched_events[i].organizers[j])
                    }
                }
            } else {
                searched_events[i]
            }

            await client.db('needfy').collection('events').updateOne({ _id: ObjectId(searched_events[i]._id) }, { $set: { "organizers": organizers_filtered } })
            counter++

        }
        res.status(200).send({ "success": true, "data": null })
    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.post('/searchevents', async (req, res) => {
    try {
        var parameters = {
            // "location": {
            //     $near: {
            //         $geometry: {
            //             type: "Point",
            //             coordinates: [req.body.lat, req.body.lon]
            //         },
            //         $maxDistance: req.body.max_distance,
            //         $minDistance: 0
            //     }
            // }
        }
        if (req.body.start != null) parameters.start = { $gte: (new Date(req.body.start)).toISOString() }
        if (req.body.created_at != null) parameters.createdAt = { $lte: (new Date(req.body.created_at)) }
        if (req.body.name != null) parameters.name = { $regex: req.body.name }
        if (req.body.genres != null && req.body.genres != []) parameters.genres = { $in: req.body.genres }
        // parameters.organizers_updated = {$exists: false}
        const searched_events = await client.db('needfy').collection('events').find(parameters).sort({ _id: -1 }).toArray()

        res.status(200).send({ "success": true, "data": searched_events })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.post('/updateeventimagename', async (req, res) => {
    try {

        const event = await client.db('needfy').collection('events').updateOne({ _id: ObjectId(req.body._id) }, { $set: { image: req.body.image } })

        res.status(200).send({ "success": true, "data": event })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.post('/updateorganizername', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) }, { $set: { name: req.body.name } })
    res.status(200).send({ "success": true, "data": club })
})

app.post('/updateentitymaps', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) },
        {
            $set:
                { maps_link: req.body.maps_link }
        })
    res.status(200).send({ "success": true, "data": club })
})

app.post('/updateclubtype', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) }, { $set: { typeUpdated: true, facebookDescription: req.body.facebook_description, type: req.body.type } })
    res.status(200).send({ "success": true, "data": club })
})


app.post('/updateclubfacebook', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body._id) }, { $set: { facebook: req.body.facebook } })
    res.status(200).send({ "success": true, "data": club })
})

app.post('/updateeventimage', async (req, res) => {
    const club = await client.db('needfy').collection('events').updateOne({ _id: ObjectId(req.body._id) }, { $set: { imageUpdated: true } })
    res.status(200).send({ "success": true, "data": null })
})

app.get('/organizerstoscrape', async (req, res) => {
    const clubs = await client.db('needfy').collection('entities_to_scrape').find({scraped: {$exists: false}}).toArray();
    res.status(200).send({ "success": true, "data": clubs })
})

app.get('/getallclubs', async (req, res) => {
    // 
    const clubs = await client.db('needfy').collection('collapsed_organizers').find({
        type: "club",
        lastUpdatedEvent: { $exists: false },
        assignedTo: parseInt(req.query.machine)
    }).sort({ _id: -1 }).toArray();
    res.status(200).send({ "success": true, "data": clubs })
})

app.get('/getallartists', async (req, res) => {
    // 
    const artists = await client.db('needfy').collection('collapsed_organizers').find({
        type: "artist"
        // lastUpdatedEvent: { "$lte": new Date(new Date() - 7 * 60 * 60 * 24 * 1000) }, assignedTo: parseInt(req.query.machine)
    }).toArray();
    res.status(200).send({ "success": true, "data": artists })
})

app.get('/recoverartistsname', async (req, res) => {
    // 
    const artists = await client.db('needfy').collection('collapsed_organizers').find({
        type: "artist",
        name: null
    }).toArray();

    for (let i = 0; i < artists.length; i++) {
        var events = [];
        events = await client.db('needfy').collection('events').findOne({ "artists.facebook": artists[i].facebook })
        if (events != null) {
            console.log(events)
            for (let j = 0; j < events.artists.length; j++) {
                if (events.artists[j].facebook == artists[i].facebook) {
                    client.db('needfy').collection('collapsed_organizers').updateOne({ facebook: artists[i].facebook }, { $set: { name: events.artists[j].name } })
                    break
                }
            }
        }
    }


    res.status(200).send({ "success": true, "data": artists })
})
app.get('/nclubstobescraped', async (req, res) => {
    // 
    const clubs = await client.db('needfy').collection('clubs').countDocuments({ lastUpdatedEvent: { "$lte": new Date(new Date() - 7 * 60 * 60 * 24 * 1000) } })
    res.status(200).send({ "success": true, "data": clubs })
})

app.post('/updateclubdatetime', async (req, res) => {
    const club = await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(req.body.id) }, { $set: { lastUpdatedEvent: new Date() } });

    res.status(200).send({ "success": true, data: club });
})



app.post('/loadevents', async (req, res) => {


    var events_to_add = req.body.data.events
    var organizers_to_add = req.body.data.organizers

    for (let i = 0; i < events_to_add.length; i++) {
        const event = await client.db('needfy').collection('events').findOne({ name: events_to_add[i].name, start: events_to_add[i].start })

        if (event == null) {
            try {
                events_to_add[i].organizers = []
                events_to_add[i].artists = []

                for (let j = 0; j < organizers_to_add.length; j++) {
                    const organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: organizers_to_add[j] })

                    if (organizer != null) {
                        if (organizer.type == "artist") {
                            events_to_add[i].artists.push(organizer)
                        } else {
                            events_to_add[i].organizers.push(organizer)
                        }
                    } else {
                        var entity_to_scrape = await client.db('needfy').collection('entities_to_scrape').findOne({ facebook: organizers_to_add[j] })
                        if (entity_to_scrape == null) {
                            await client.db('needfy').collection('entities_to_scrape').insertOne({ "facebook": organizers_to_add[j] })
                        }
                        console.log("ORGANIZZATORE NON TROVATO: " + organizers_to_add[j])
                        events_to_add[i].organizers.push(organizers_to_add[j])
                    }
                }
                events_to_add[i].createdAt = new Date()
                events_to_add[i].start = new Date(events_to_add[i].start)
                if (events_to_add[i].end != undefined) {
                    events_to_add[i].end = new Date(events_to_add[i].end)
                }
                await client.db('needfy').collection('events').insertOne(events_to_add[i])
                res.status(200).send({ "success": true, "data": "New event added" })
            } catch (error) {
                console.log(error)
                res.status(200).send({ "success": true, "data": "Event not added" })
            }
        } else {
            res.status(200).send({ "success": true, "data": "Event already present" })
        }
    }
})


app.get('/eventsbyworker', async (req, res) => {
    var machine_0_count = await client.db('needfy').collection('events').countDocuments({ addedByMachine: 0 });
    var machine_1_count = await client.db('needfy').collection('events').countDocuments({ addedByMachine: 1 });

    res.status(200).send({ "success": true, "data": { "machine_0_count": machine_0_count, "machine_1_count": machine_1_count } })
})

app.get('/eventsbydate', async (req, res) => {

    var keys = [];

    for (let i = 6; i >= 0; i--) {
        keys.push(new Date(new Date() - i * 60 * 60 * 24 * 1000).toISOString().split('T')[0])
    }




    var result = await client.db('needfy').collection('events').aggregate([
        {
            "$match":
            {
                addedByMachine: parseInt(req.query.machine),
                createdAt: {
                    $gte: new Date(new Date() - 6 * 60 * 60 * 24 * 1000)
                }
            }
        },
        {
            "$group": {
                _id: { "$dateToString": { date: { "$toDate": "$_id" }, format: '%Y-%m-%d' } },
                "count": { "$sum": 1 }

            }
        }
        ,
        { "$sort": { "_id": 1 } }

    ], { allowDiskUse: true }).toArray()

    for (let j = 0; j < keys.length; j++) {
        if (result[j] == null || result[j]._id != keys[j]) {
            result.splice(j, 0, { _id: keys[j], count: 0 });
        }
    }

    res.status(200).send({ "success": true, "data": result })
})

app.post('/addreviews', async (req, res) => {
    try {
        var reviews_to_add = []
        for (let i = 0; i < req.body.reviews.length; i++) {
            req.body.reviews[i].entity_id = ObjectId(req.body.reviews[i].entity_id)
            req.body.reviews[i].createdAt = (new Date(req.body.reviews[i].createdAt))
            const review = await client.db('needfy').collection('reviews').findOne({
                username: req.body.reviews[i].username,
                description: req.body.reviews[i].description,
                entity_id: req.body.reviews[i].entity_id
            })
            if (review == null) {
                reviews_to_add.push(req.body.reviews[i])
            }
        }
        if (reviews_to_add.length > 0) {
            client.db('needfy').collection('reviews').insertMany(reviews_to_add)
            await client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(reviews_to_add[0].entity_id) }, { $set: { retrieved_reviews: true } })
        }

    } catch (e) {
        res.status(500).send({ "success": false, "data": null })
    }
    console.log("added" + reviews_to_add.length)
    res.status(200).send({ "success": true, "data": "added" + reviews_to_add.length })
})

app.post('/loadclubs', async (req, res) => {

    console.log("loading club... ")
    console.log(req.body.data[0])
    var data
    for (let i = 0; i < req.body.data.length; i++) {
        const club = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: req.body.data[i].facebook })
        const club2 = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: req.body.data[i].facebook.slice(0, -1) })

        if ((club == null) && (club2 == null)) {
            try {
                req.body.data[i].createdAt = new Date()
                data = await client.db('needfy').collection('collapsed_organizers').insertOne(req.body.data[i])
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

app.get('/getreviewedclubs', async (req, res) => {

    var groupedevents = await client.db('needfy').collection('reviews').aggregate([{ "$group": { "_id": "$entity_id", "count": { "$sum": 1 } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gte": 10 } } }], { allowDiskUse: true }).toArray()

    var clubs = await client.db('needfy').collection('collapsed_organizers').find({ retrieved_reviews: { $exists: false }, _id: { $in: groupedevents.map((element) => { return ObjectId(element._id) }) } }).toArray()

    res.status(200).send({ "success": true, "data": clubs })

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
app.get('/getduplicatesclubs', async (req, res) => {

    var groupedclubs = await client.db('needfy').collection('collapsed_organizers').aggregate([{ "$group": { "_id": { "facebook": "$facebook" }, "count": { "$sum": 1 }, clubs: { $push: "$$ROOT" } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gt": 1 } } }, { "$sort": { "count": -1 } }], { allowDiskUse: true }).toArray()

    res.status(200).send({ "success": true, "data": groupedclubs })

})

app.get('/removeduplicatedclubs', async (req, res) => {

    var groupedclubs = await client.db('needfy').collection('collapsed_organizers').aggregate([{ "$group": { "_id": { "facebook": "$facebook" }, "count": { "$sum": 1 }, clubs: { $push: "$$ROOT" } } }, { "$match": { "_id": { "$ne": null }, "count": { "$gt": 1 } } }, { "$sort": { "count": -1 } }], { allowDiskUse: true }).toArray()
    for (let i = 0; i < groupedclubs.length; i++) {
        var i_max = 0
        for (let j = 0; j < groupedclubs[i].clubs.length; j++) {
            nfields = Object.keys(groupedclubs[i].clubs[j]).length
            if (nfields >= i_max) {
                i_max = j
            }
        }

        for (let j = 0; j < groupedclubs[i].clubs.length; j++) {
            if (j != i_max) {
                client.db('needfy').collection('collapsed_organizers').deleteOne({ _id: groupedclubs[i].clubs[j]._id })
            }
        }


    }
    res.status(200).send({ "success": true, "data": groupedclubs })

})

app.get('/fixuncorrespondingclubs', async (req, res) => {

    var tot = 0
    var events = await client.db('needfy').collection('events').find().toArray()
    for (let i = 0; i < events.length; i++) {
        if ((tot % 100) == 0) console.log(tot)
        if (events[i].club != undefined) {
            if (events[i].club.facebook != undefined) {
                var club = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: events[i].club.facebook })
                await client.db('needfy').collection('events').updateOne({ _id: ObjectId(events[i]._id) }, { $set: { "club": club } })
            } else if (events[i].club.name != undefined) {
                var club = await client.db('needfy').collection('collapsed_organizers').findOne({ name: events[i].club.name })
                await client.db('needfy').collection('events').updateOne({ _id: ObjectId(events[i]._id) }, { $set: { "club": club } })
            }
        }
        tot++

    }
    res.status(200).send({ "success": true, "data": null })

})

app.post('/loadorganizer', async (req, res) => {

    const club = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: req.body.data.facebook })
    if (club == null) {
        try {
            req.body.data.createdAt = new Date()
            await client.db('needfy').collection('collapsed_organizers').insertOne(req.body.data)
        } catch (error) {
            console.log(error)
        }
    }

    res.status(200).send({ "success": true, "data": null })
})

app.post('/setorganizerasscraped', async (req, res) => {

    client.db('needfy').collection('entities_to_scrape').updateOne({ facebook: req.body.facebook }, {$set: {scraped: true}})
    res.status(200).send({ "success": true, "data": null })
})

app.get('/standardizeclubs', async (req, res) => {
    try {

        var clubstofix = await client.db('needfy').collection('collapsed_organizers').find({ facebook: { $regex: "/pg/" } }).toArray()
        for (let i = 0; i < clubstofix.length; i++) {
            var new_link = clubstofix[i].facebook.replace("/pg/", "/")
            const organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: new_link })
            if (organizer != null) {
                client.db('needfy').collection('collapsed_organizers').deleteOne({ _id: ObjectId(organizer._id) })
            } else {
                client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(clubstofix[i]._id) }, { $set: { facebook: new_link } })
            }

        }
        res.status(200).send({ "success": true, "data": "fixed " + clubstofix.length + " clubs." })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})
app.get('/standardizeclubsfacebook', async (req, res) => {
    try {

        var removed = 0
        var updated = 0
        var clubstofix = await client.db('needfy').collection('collapsed_organizers').find().toArray()
        for (let i = 0; i < clubstofix.length; i++) {
            var new_link = clubstofix[i].facebook.toLowerCase()
            if (new_link != clubstofix[i].facebook) {
                const organizer = await client.db('needfy').collection('collapsed_organizers').findOne({ facebook: new_link })
                if (organizer != null) {
                    client.db('needfy').collection('collapsed_organizers').deleteOne({ _id: ObjectId(clubstofix[i]._id) })
                    removed++
                } else {
                    client.db('needfy').collection('collapsed_organizers').updateOne({ _id: ObjectId(clubstofix[i]._id) }, { $set: { facebook: new_link } })
                    updated++
                }
            }

        }
        res.status(200).send({ "success": true, "data": "Deleted " + removed + " clubs. Updated " + updated + ' clubs.' })

    } catch (error) {
        console.log(error)
        res.status(500).send({ "error": error })
    }
})

app.get('/mergeorganizers', async (req, res) => {
    try {

        var clubs = await client.db('needfy').collection('clubs').find().toArray()

        for (let i = 0; i < clubs.length; i++) {
            delete clubs[i]._id
            client.db('needfy').collection('collapsed_organizers').insertOne(clubs[i])

        }

        var artists = await client.db('needfy').collection('artists').find().toArray()

        for (let i = 0; i < artists.length; i++) {
            delete artists[i]._id
            client.db('needfy').collection('collapsed_organizers').insertOne(artists[i])

        }

        var organizers = await client.db('needfy').collection('organizers').find().toArray()

        for (let i = 0; i < organizers.length; i++) {
            delete organizers[i]._id
            client.db('needfy').collection('collapsed_organizers').insertOne(organizers[i])

        }


        res.status(200).send({ "success": true, "data": null })


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

        var organizer = await client.db('needfy').collection('collapsed_organizers').findOne({
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